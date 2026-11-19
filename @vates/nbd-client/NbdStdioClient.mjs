import assert from 'node:assert'
import { spawn } from 'node:child_process'
import { pFromCallback, pTimeout } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import AbstractNbdClient from './AbstractNbdClient.mjs'

const { warn } = createLogger('vates:nbd-client:stdio')

// only the tail is kept: it's the part describing why the server died
const STDERR_MAX_LENGTH = 4096

// how long a failed connection waits for the server to exit and its stderr to end
const CLOSE_TIMEOUT = 1e3

/**
 * NBD client talking to a server through its standard streams, like
 * `nbdkit -s` or `qemu-nbd` in `--fd` mode: the queries are written to the
 * server stdin and its answers are read from its stdout.
 *
 * The process is spawned on `connect()` and killed on `disconnect()`, and
 * `reconnect()` (used by `readBlock()` retries) spawns a brand new one: the
 * server must be restartable, and must serve the same content on each run.
 *
 * There is no TLS here: the transport is a pair of pipes, nothing to encrypt.
 *
 * @extends {AbstractNbdClient}
 */
export default class NbdStdioClient extends AbstractNbdClient {
  #args
  #command
  #cwd
  #env

  /** @type {{ child: import('node:child_process').ChildProcess, closing: boolean, stderr: string, closed: Promise<unknown> }|undefined} */
  #state

  /**
   * @param {object} settings
   * @param {string} settings.command - the NBD server to run
   * @param {ReadonlyArray<string>} [settings.args] - its arguments
   * @param {string} [settings.exportname] - empty (the default export) for most single connection servers
   * @param {NodeJS.ProcessEnv} [settings.env]
   * @param {string} [settings.cwd]
   * @param {object} [options] - see {@link AbstractNbdClient}
   */
  constructor({ command, args = [], exportname, env, cwd }, options) {
    super({ exportname }, options)
    assert.strictEqual(typeof command, 'string', 'command must be a string')
    this.#command = command
    this.#args = args
    this.#env = env
    this.#cwd = cwd
  }

  /**
   * the tail of what the server wrote on stderr since it was spawned, useful to
   * report why it failed
   *
   * @returns {string}
   */
  get stderr() {
    return this.#state?.stderr ?? ''
  }

  /**
   * the pid of the current server process, undefined if it's not running
   *
   * @returns {number|undefined}
   */
  get pid() {
    return this.#state?.child.pid
  }

  /**
   * A server dying before the handshake makes it fail with "stream has ended
   * without data", and the exit handler, racing with the teardown, often
   * reports nothing: what the server wrote on stderr is the only reason given,
   * so it becomes the error.
   */
  async connect() {
    try {
      return await super.connect()
    } catch (error) {
      const state = this.#state
      const closed =
        state !== undefined &&
        (await pTimeout.call(state.closed, CLOSE_TIMEOUT).then(
          () => true,
          () => false
        ))
      // exitCode is null when the process was killed, by us when it did not die by itself
      if (closed && state.child.exitCode !== null && state.stderr !== '') {
        const serverError = new Error(state.stderr.trim(), { cause: error })
        serverError.code = 'NBD_SERVER_EXITED'
        serverError.exitCode = state.child.exitCode
        serverError.command = this.#command
        throw serverError
      }
      throw error
    }
  }

  async _openTransport() {
    const child = spawn(this.#command, this.#args, {
      cwd: this.#cwd,
      env: this.#env,
      // the protocol goes through stdin/stdout, stderr is only used for diagnostics
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const state = {
      child,
      closing: false,
      stderr: '',
      // 'close' comes after the exit and the end of the standard streams: stderr is complete
      closed: new Promise(resolve => child.once('close', resolve)),
    }
    this.#state = state

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      state.stderr = (state.stderr + chunk).slice(-STDERR_MAX_LENGTH)
    })

    // spawn failures (ENOENT, EACCES, ...) are reported asynchronously
    await new Promise((resolve, reject) => {
      const onError = error => {
        error.command = this.#command
        reject(error)
      }
      child.once('error', onError)
      child.once('spawn', () => {
        child.removeListener('error', onError)
        // from now on, an error on the process itself (a failed kill for
        // example) must not be thrown as an uncaught exception
        child.on('error', error => warn('error on the nbd server process', { error, command: this.#command }))
        resolve()
      })
    })

    child.once('exit', (code, signal) => {
      if (state.closing) {
        // expected: disconnect() asked it to quit and is waiting for this
        return
      }
      const error = new Error(`the nbd server process exited (code: ${code}, signal: ${signal})`)
      error.code = 'NBD_SERVER_EXITED'
      error.exitCode = code
      error.signal = signal
      error.command = this.#command
      error.stderr = state.stderr
      warn('the nbd server process exited unexpectedly', { error })
      // make the pending and future reads fail with this error instead of
      // waiting for the message timeout on a stream that will never answer
      child.stdout.destroy(error)
      child.stdin.destroy()
    })

    return { readable: child.stdout, writable: child.stdin, state }
  }

  async _closeTransport(transport, lastMessage) {
    const { state } = transport
    state.closing = true

    // hand over NBD_CMD_DISC, then close stdin: that's how the server knows
    // it can quit
    await pFromCallback(cb => transport.writable.end(lastMessage, cb))

    // don't let the server block on a write while we wait for its exit
    transport.readable.resume()

    const { child } = state
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise(resolve => child.once('exit', () => resolve()))
    }
  }

  _destroyTransport(transport) {
    const { state } = transport
    const { child } = state
    // we're the one tearing it down: the exit that follows is expected, not a
    // crash, and destroying the streams can be enough to make the server quit
    state.closing = true
    transport.readable.destroy()
    transport.writable.destroy()
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
    }
  }

  // getMap() is not implemented: `nbdinfo` needs an URI or a server supporting
  // systemd socket activation, and this one only speaks through its standard
  // streams. Compute the map on the caller side and pass it explicitly (
  // `new NbdDisk(infos, blockSize, { dataMap })`).
}
