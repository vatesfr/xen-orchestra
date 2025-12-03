// @ts-check

import { createLogger } from '@xen-orchestra/log'
import { fork } from 'child_process'
import { join } from 'path'

/**
 * @typedef {Object} IpcMessage
 * @property {string} type
 * @property {unknown} [payload]
 * @property {string} [requestId]
 * @property {string} [error]
 */

/**
 * @typedef {Object} PluginConfiguration
 * @property {number} port
 * @property {string} bindAddress
 */

const logger = createLogger('xo:xo-server-openmetrics')

/** Default timeout for IPC operations in milliseconds */
const IPC_TIMEOUT_MS = 10_000

/** Default timeout for graceful shutdown in milliseconds */
const SHUTDOWN_TIMEOUT_MS = 5_000

export const configurationSchema = {
  type: 'object',
  properties: {
    port: {
      type: 'number',
      title: 'Port',
      description: 'Port for the OpenMetrics HTTP server',
      default: 9004,
      minimum: 1,
      maximum: 65535,
    },
    bindAddress: {
      type: 'string',
      title: 'Bind Address',
      description: 'Address to bind to (127.0.0.1 for localhost only, 0.0.0.0 for all interfaces)',
      default: '127.0.0.1',
    },
  },
  additionalProperties: false,
}

class OpenMetricsPlugin {
  /** @type {PluginConfiguration | undefined} */
  #configuration

  /** @type {import('child_process').ChildProcess | undefined} */
  #childProcess

  /** @type {Map<string, { resolve: (value: unknown) => void, reject: (error: Error) => void }>} */
  #pendingRequests = new Map()

  /** @type {number} */
  #requestIdCounter = 0

  /**
   * @param {Object} xo - The xo-server instance
   */
  constructor(xo) {
    this._xo = xo
  }

  /**
   * Configure the plugin with the provided configuration.
   * @param {PluginConfiguration} configuration
   */
  async configure(configuration) {
    this.#configuration = configuration
    logger.debug('Plugin configured', { configuration })
  }

  /**
   * Load and start the plugin.
   * Forks the child process and waits for it to be ready.
   */
  async load() {
    if (this.#childProcess !== undefined) {
      logger.warn('Plugin already loaded, skipping')
      return
    }

    const configuration = this.#configuration
    if (configuration === undefined) {
      throw new Error('Plugin not configured')
    }

    logger.info('Starting OpenMetrics server', {
      port: configuration.port,
      bindAddress: configuration.bindAddress,
    })

    await this.#startChildProcess(configuration)
  }

  /**
   * Unload and stop the plugin.
   * Gracefully shuts down the child process.
   */
  async unload() {
    if (this.#childProcess === undefined) {
      return
    }

    logger.info('Stopping OpenMetrics server')

    await this.#stopChildProcess()
  }

  /**
   * Test the plugin configuration.
   */
  async test() {
    logger.debug('Testing OpenMetrics plugin')
  }

  /**
   * Start the child process and wait for it to be ready.
   * @param {PluginConfiguration} configuration
   */
  async #startChildProcess(configuration) {
    const serverPath = join(__dirname, 'open-metric-server.js')

    this.#childProcess = fork(serverPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    const child = this.#childProcess

    child.on('message', message => this.#handleChildMessage(message))

    child.on('error', error => {
      logger.error('Child process error', { error })
    })

    child.on('exit', (code, signal) => {
      logger.info('Child process exited', { code, signal })
      this.#childProcess = undefined
      this.#rejectAllPendingRequests(new Error(`Child process exited with code ${code}`))
    })

    if (child.stdout !== null) {
      child.stdout.on('data', data => {
        logger.debug('Child stdout', { data: data.toString() })
      })
    }

    if (child.stderr !== null) {
      child.stderr.on('data', data => {
        logger.warn('Child stderr', { data: data.toString() })
      })
    }

    await this.#sendToChild({ type: 'INIT', payload: configuration })

    await this.#waitForReady()
  }

  /**
   * Stop the child process gracefully.
   */
  async #stopChildProcess() {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    try {
      this.#sendToChildNoWait({ type: 'SHUTDOWN' })

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          logger.warn('Child process did not exit gracefully, forcing kill')
          child.kill('SIGKILL')
          resolve(undefined)
        }, SHUTDOWN_TIMEOUT_MS)

        child.once('exit', () => {
          clearTimeout(timeout)
          resolve(undefined)
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
   * @param {unknown} rawMessage
   */
  #handleChildMessage(rawMessage) {
    /** @type {IpcMessage} */
    const message = /** @type {IpcMessage} */ (rawMessage)

    logger.debug('Received message from child', { type: message.type })

    switch (message.type) {
      case 'READY':
        this.#resolvePendingRequest('READY', undefined)
        break

      case 'ERROR':
        logger.error('Child process error', { error: message.error })
        this.#rejectPendingRequest('READY', new Error(String(message.error)))
        break

      case 'GET_METRICS': {
        const metrics = this.#collectMetrics()
        this.#sendToChildNoWait({
          type: 'METRICS_RESPONSE',
          requestId: message.requestId,
          payload: metrics,
        })
        break
      }

      default:
        logger.warn('Unknown message type from child', { type: message.type })
    }
  }

  /**
   * Collect metrics from xo-server.
   * This is a placeholder for XO-1666 which will implement actual RRD collection.
   * @returns {string}
   */
  #collectMetrics() {
    // Placeholder - XO-1666 will implement actual metrics collection
    return '# OpenMetrics placeholder\n# HELP xo_info XO Server information\n# TYPE xo_info gauge\nxo_info 1\n'
  }

  /**
   * Send a message to the child process and wait for acknowledgment.
   * @param {IpcMessage} message
   */
  async #sendToChild(message) {
    const child = this.#childProcess
    if (child === undefined) {
      throw new Error('Child process not running')
    }

    child.send(message)
  }

  /**
   * Send a message to the child process without waiting.
   * @param {IpcMessage} message
   */
  #sendToChildNoWait(message) {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    child.send(message)
  }

  /**
   * Wait for the child process to be ready.
   * @returns {Promise<void>}
   */
  #waitForReady() {
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
        reject: error => {
          clearTimeout(timeout)
          reject(error)
        },
      })
    })
  }

  /**
   * Resolve a pending request.
   * @param {string} requestId
   * @param {unknown} value
   */
  #resolvePendingRequest(requestId, value) {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.resolve(value)
    }
  }

  /**
   * Reject a pending request.
   * @param {string} requestId
   * @param {Error} error
   */
  #rejectPendingRequest(requestId, error) {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.reject(error)
    }
  }

  /**
   * Reject all pending requests.
   * @param {Error} error
   */
  #rejectAllPendingRequests(error) {
    for (const pending of this.#pendingRequests.values()) {
      pending.reject(error)
    }
    this.#pendingRequests.clear()
  }
}

/**
 * Plugin factory function.
 * @param {{ xo: Object }} opts
 * @returns {OpenMetricsPlugin}
 */
export default function ({ xo }) {
  return new OpenMetricsPlugin(xo)
}
