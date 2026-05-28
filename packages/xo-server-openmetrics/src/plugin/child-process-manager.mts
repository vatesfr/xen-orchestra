/**
 * Child-process lifecycle + IPC for the OpenMetrics plugin (parent side).
 *
 * Owns the forked `open-metric-server.mjs` process, the pending-request map
 * (with the READY timeout), and the low-level `send` helpers. Lifecycle
 * (`start`/`stop`) and the READY/ERROR handshake live here; child-originated
 * data requests (`GET_*`) are delegated to the `onRequest` callback the plugin
 * injects, so the manager stays free of any XO/data knowledge.
 *
 * Extracted from `OpenMetricsPlugin`. The method bodies are verbatim except:
 * - `this.#childProcess` / `this.#pendingRequests` now refer to this class's
 *   own fields;
 * - the message dispatch handles READY/ERROR here and forwards every other
 *   message to `this.#onRequest(message)` (the plugin's former `GET_*` switch);
 * - the server path resolves to `../open-metric-server.mjs` because this module
 *   sits one directory below `index.mjs`, while the child stays a sibling of
 *   `index.mjs` in `dist/` (same resolved target as before).
 */

import { createLogger } from '@xen-orchestra/log'
import { fork, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { IpcMessage, PendingRequest, ServerConfiguration } from '../types/ipc.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const logger = createLogger('xo:xo-server-openmetrics')

/** Default timeout for IPC operations in milliseconds */
const IPC_TIMEOUT_MS = 10_000

/** Default timeout for graceful shutdown in milliseconds */
const SHUTDOWN_TIMEOUT_MS = 5_000

export class ChildProcessManager {
  #childProcess: ChildProcess | undefined
  #pendingRequests = new Map<string, PendingRequest>()
  readonly #onRequest: (message: IpcMessage) => void

  /**
   * @param onRequest Handles child-originated data requests (every message
   *   type other than the READY/ERROR handshake). Supplied by the plugin so
   *   the manager carries no XO/data dependencies.
   */
  constructor(onRequest: (message: IpcMessage) => void) {
    this.#onRequest = onRequest
  }

  /** Whether the child process is currently running. */
  get isRunning(): boolean {
    return this.#childProcess !== undefined
  }

  /**
   * Start the child process and wait for it to be ready.
   */
  async start(configuration: ServerConfiguration): Promise<void> {
    const serverPath = join(__dirname, '..', 'open-metric-server.mjs')

    this.#childProcess = fork(serverPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    const child = this.#childProcess

    child.on('message', (message: unknown) => this.#handleChildMessage(message))

    child.on('error', (error: Error) => {
      logger.error('Child process error', { error })
    })

    child.on('exit', (code: number | null, signal: string | null) => {
      logger.info('Child process exited', { code, signal })
      this.#childProcess = undefined
      this.#rejectAllPendingRequests(new Error(`Child process exited with code ${code}`))
    })

    if (child.stdout !== null) {
      child.stdout.on('data', (data: Buffer) => {
        logger.debug('Child stdout', { data: data.toString() })
      })
    }

    if (child.stderr !== null) {
      child.stderr.on('data', (data: Buffer) => {
        logger.warn('Child stderr', { data: data.toString() })
      })
    }

    this.#sendToChild({ type: 'INIT', payload: configuration })

    await this.#waitForReady()
  }

  /**
   * Stop the child process gracefully.
   */
  async stop(): Promise<void> {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    try {
      this.sendNoWait({ type: 'SHUTDOWN' })

      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          logger.warn('Child process did not exit gracefully, forcing kill')
          child.kill('SIGKILL')
          resolve()
        }, SHUTDOWN_TIMEOUT_MS)

        child.once('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })
    } catch (error) {
      logger.error('Error stopping child process', { error })
      child.kill('SIGKILL')
    } finally {
      this.#childProcess = undefined
      this.#rejectAllPendingRequests(new Error('Plugin unloaded'))
    }
  }

  /**
   * Handle messages received from the child process.
   */
  #handleChildMessage(rawMessage: unknown): void {
    const message = rawMessage as IpcMessage

    logger.debug('Received message from child', { type: message.type })

    switch (message.type) {
      case 'READY':
        this.#resolvePendingRequest('READY', undefined)
        break

      case 'ERROR':
        // ERROR is only sent during initialization when the child process fails to start
        // (e.g., unable to bind to port). At this point, load() is waiting for READY,
        // so we reject that pending request to propagate the failure.
        logger.error('Child process error', { error: message.error })
        this.#rejectPendingRequest('READY', new Error(String(message.error)))
        break

      default:
        this.#onRequest(message)
    }
  }

  /**
   * Send a message to the child process.
   */
  #sendToChild(message: IpcMessage): void {
    const child = this.#childProcess
    if (child === undefined) {
      throw new Error('Child process not running')
    }

    child.send(message)
  }

  /**
   * Send a message to the child process without throwing if not running.
   */
  sendNoWait(message: IpcMessage): void {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    child.send(message)
  }

  /**
   * Wait for the child process to be ready.
   */
  #waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pendingRequests.delete('READY')
        reject(new Error('Timeout waiting for child process to be ready'))
      }, IPC_TIMEOUT_MS)

      this.#pendingRequests.set('READY', {
        resolve: () => {
          clearTimeout(timeout)
          resolve()
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })
    })
  }

  /**
   * Resolve a pending request.
   */
  #resolvePendingRequest(requestId: string, value: unknown): void {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.resolve(value)
    }
  }

  /**
   * Reject a pending request.
   */
  #rejectPendingRequest(requestId: string, error: Error): void {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.reject(error)
    }
  }

  /**
   * Reject all pending requests.
   */
  #rejectAllPendingRequests(error: Error): void {
    for (const pending of this.#pendingRequests.values()) {
      pending.reject(error)
    }
    this.#pendingRequests.clear()
  }
}
