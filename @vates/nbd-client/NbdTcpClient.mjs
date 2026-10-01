import { Socket } from 'node:net'
import { connect } from 'node:tls'
import { spawn } from 'node:child_process'
import AbstractNbdClient from './AbstractNbdClient.mjs'
import { NBD_DEFAULT_PORT, NBD_OPT_STARTTLS } from './constants.mjs'
import { PassThrough } from 'node:stream'

// the kernel writes the received data into this buffer, reused for every read
const ONREAD_BUFFER_SIZE = 1024 * 1024

/**
 * Receives the data of `socket` through its `onread` option.
 *
 * During the handshake the (small and rare) chunks are copied into `readable`,
 * then `setReceiver()` hands the reused buffer directly to the parser of the answers.
 *
 * `onread` must be given to the constructor of the socket, which is then given to `attach()`
 */
function createOnReadTransport() {
  const readable = new PassThrough()
  let receiver
  const transport = {
    readable,
    writable: undefined,
    setReceiver(fn) {
      // what came with the end of the handshake must be parsed first
      let chunk
      while ((chunk = readable.read()) !== null) {
        fn(chunk, chunk.length)
      }
      receiver = fn
    },
  }
  return {
    onread: {
      buffer: Buffer.allocUnsafeSlow(ONREAD_BUFFER_SIZE),
      callback(length, buffer) {
        if (receiver !== undefined) {
          receiver(buffer, length)
        } else {
          readable.write(Buffer.from(buffer.subarray(0, length)))
        }
      },
    },
    attach(socket) {
      transport.writable = socket
      // with `onread` the socket does not emit its data, but its end must still reach the readers
      socket.once('end', () => readable.end())
      socket.once('close', () => readable.destroy())
    },
    transport,
  }
}

/**
 * NBD client talking to a server over TCP, optionally upgrading the connection
 * to TLS during the handshake.
 *
 * @extends {AbstractNbdClient}
 */
export default class NbdTcpClient extends AbstractNbdClient {
  #serverAddress
  #serverCert
  #serverPort

  /**
   * @param {object} settings
   * @param {string} settings.address
   * @param {number} [settings.port]
   * @param {string} [settings.exportname]
   * @param {string} [settings.cert] - PEM certificate, enables TLS when set
   * @param {object} [options] - see {@link AbstractNbdClient}
   */
  constructor({ address, port = NBD_DEFAULT_PORT, exportname, cert }, options) {
    super({ exportname }, options)
    this.#serverAddress = address
    this.#serverPort = port
    this.#serverCert = cert
  }

  // mandatory , at least to start the handshake: the connection always starts
  // unsecured, and is upgraded to TLS during the handshake
  async _openTransport() {
    // without TLS, the kernel writes the answers into a reused buffer instead of a new Buffer per chunk:
    // this is what keeps the GC quiet at high throughput (TLS sockets ignore `onread`)
    const onRead = this.#serverCert === undefined ? createOnReadTransport() : undefined
    // `onread` is only taken into account by the constructor
    const socket = new Socket({ onread: onRead?.onread })
    onRead?.attach(socket)
    await new Promise((resolve, reject) => {
      socket.connect(this.#serverPort, this.#serverAddress)
      socket.once('error', reject)
      socket.once('connect', () => {
        socket.removeListener('error', reject)
        resolve()
      })
    })
    return onRead?.transport ?? { readable: socket, writable: socket }
  }

  async _secureTransport(transport) {
    if (this.#serverCert === undefined) {
      return transport
    }
    await this._sendOption(transport, NBD_OPT_STARTTLS)
    const secured = await new Promise((resolve, reject) => {
      const socket = connect({
        socket: transport.writable,
        rejectUnauthorized: false,
        cert: this.#serverCert,
      })
      socket.once('error', reject)
      socket.once('secureConnect', () => {
        socket.removeListener('error', reject)
        resolve(socket)
      })
    })
    return { readable: secured, writable: secured }
  }

  /**
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ offset: number, length: number, type: number }[]>}
   */
  /* async */ getMap(signal) {
    return new Promise((resolve, reject) => {
      const process = spawn('nbdinfo', [
        '--json',
        '--map',
        `nbd://${this.#serverAddress}:${this.#serverPort}/${encodeURIComponent(this.exportName)}`,
      ])
      let text = ''
      let errText = ''
      process.stdout.on('data', data => (text += data))
      process.stderr.on('data', data => (errText += data))
      const onAbort = () => {
        process.kill()
        reject(signal.reason)
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      process.on('error', err => {
        signal?.removeEventListener('abort', onAbort)
        reject(err)
      })
      process.on('close', code => {
        signal?.removeEventListener('abort', onAbort)
        if (code !== 0) {
          return reject(new Error(`Error during getMap (code: ${code}): ${errText}`))
        }
        try {
          const json = JSON.parse(text)
          resolve(json)
        } catch (error) {
          reject(new Error(`${error} ${text}`))
        }
      })
    })
  }
}
