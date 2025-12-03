// @ts-check

/**
 * OpenMetrics HTTP Server - Child Process
 *
 * This script runs as a separate process, forked by the main plugin.
 * It serves metrics on an HTTP endpoint and communicates with the
 * parent process via IPC.
 *
 * The process terminates gracefully by:
 * 1. Closing the HTTP server (stops accepting new connections)
 * 2. Disconnecting from the parent IPC channel
 * 3. Letting the event loop drain naturally
 */

import { createServer } from 'http'

/**
 * @typedef {Object} IpcMessage
 * @property {string} type
 * @property {unknown} [payload]
 * @property {string} [requestId]
 * @property {string} [error]
 */

/**
 * @typedef {Object} ServerConfiguration
 * @property {number} port
 * @property {string} bindAddress
 */

/** @type {import('http').Server | undefined} */
let server

/** @type {ServerConfiguration | undefined} */
let configuration

/** @type {Map<string, { resolve: (value: unknown) => void, reject: (error: Error) => void, timer: NodeJS.Timeout }>} */
const pendingMetricsRequests = new Map()

/** Counter for generating unique request IDs */
let requestIdCounter = 0

/** Timeout for metrics requests in milliseconds */
const METRICS_REQUEST_TIMEOUT_MS = 30_000

/** Flag to prevent multiple shutdown attempts */
let isShuttingDown = false

/**
 * Send a message to the parent process.
 * @param {IpcMessage} message
 */
function sendToParent(message) {
  if (process.send !== undefined && process.connected) {
    process.send(message)
  }
}

/**
 * Handle incoming IPC messages from the parent process.
 * @param {unknown} rawMessage
 */
function handleParentMessage(rawMessage) {
  /** @type {IpcMessage} */
  const message = /** @type {IpcMessage} */ (rawMessage)

  switch (message.type) {
    case 'INIT':
      handleInit(/** @type {ServerConfiguration} */ (message.payload))
      break

    case 'SHUTDOWN':
      handleShutdown()
      break

    case 'METRICS_RESPONSE':
      handleMetricsResponse(message)
      break

    default:
      console.error(`Unknown message type: ${message.type}`)
  }
}

/**
 * Initialize the server with the given configuration.
 * @param {ServerConfiguration} config
 */
async function handleInit(config) {
  configuration = config

  try {
    await startServer()
    sendToParent({ type: 'READY' })
  } catch (error) {
    sendToParent({
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    })
    process.exitCode = 1
    cleanup()
  }
}

/**
 * Clean up resources and let the process terminate naturally.
 * This closes the server and disconnects IPC, allowing the event loop to drain.
 */
function cleanup() {
  // Cancel all pending metrics requests
  for (const pending of pendingMetricsRequests.values()) {
    clearTimeout(pending.timer)
    pending.reject(new Error('Server shutting down'))
  }
  pendingMetricsRequests.clear()

  // Close the HTTP server
  if (server !== undefined) {
    server.close()
    server = undefined
  }

  // Disconnect from parent IPC channel - this allows the process to exit naturally
  if (process.connected) {
    process.disconnect()
  }
}

/**
 * Handle shutdown request from parent.
 * Gracefully closes the server and disconnects IPC to let the process exit.
 */
function handleShutdown() {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true

  process.exitCode = 0
  cleanup()
}

/**
 * Handle metrics response from parent.
 * @param {IpcMessage} message
 */
function handleMetricsResponse(message) {
  const requestId = message.requestId
  if (requestId === undefined) {
    return
  }

  const pending = pendingMetricsRequests.get(requestId)
  if (pending !== undefined) {
    clearTimeout(pending.timer)
    pendingMetricsRequests.delete(requestId)
    pending.resolve(message.payload)
  }
}

/**
 * Request metrics from the parent process.
 * @returns {Promise<string>}
 */
async function requestMetrics() {
  const requestId = `metrics-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingMetricsRequests.delete(requestId)
      reject(new Error('Timeout waiting for metrics from parent'))
    }, METRICS_REQUEST_TIMEOUT_MS)

    pendingMetricsRequests.set(requestId, {
      resolve: value => resolve(/** @type {string} */ (value)),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_METRICS', requestId })
  })
}

/**
 * Start the HTTP server.
 */
async function startServer() {
  if (configuration === undefined) {
    throw new Error('Server not configured')
  }

  const { port, bindAddress } = configuration

  server = createServer(async (req, res) => {
    const url = req.url ?? '/'
    const method = req.method ?? 'GET'

    // Health check endpoint
    if (url === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }

    // Metrics endpoint
    if (url === '/metrics' && method === 'GET') {
      try {
        const metrics = await requestMetrics()
        res.writeHead(200, {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        })
        res.end(metrics)
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Internal server error',
          })
        )
      }
      return
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  return new Promise((resolve, reject) => {
    server.on('error', error => {
      reject(error)
    })

    server.listen(port, bindAddress, () => {
      resolve(undefined)
    })
  })
}

// Set up IPC message handler
process.on('message', handleParentMessage)

// Handle parent disconnect (parent process died)
process.on('disconnect', () => {
  if (!isShuttingDown) {
    process.exitCode = 1
    cleanup()
  }
})

// Handle process signals
process.on('SIGTERM', () => {
  handleShutdown()
})

process.on('SIGINT', () => {
  handleShutdown()
})

// Handle uncaught errors
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error)
  sendToParent({ type: 'ERROR', error: error.message })
  process.exitCode = 1
  cleanup()
})

process.on('unhandledRejection', reason => {
  console.error('Unhandled rejection:', reason)
  sendToParent({
    type: 'ERROR',
    error: reason instanceof Error ? reason.message : String(reason),
  })
})
