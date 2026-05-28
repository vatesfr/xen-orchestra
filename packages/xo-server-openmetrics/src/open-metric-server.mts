/**
 * OpenMetrics HTTP Server - Child Process
 *
 * This script runs as a separate process, forked by the main plugin.
 * It serves metrics on an HTTP endpoint and communicates with the
 * parent process via IPC.
 *
 * The child process fetches RRD data directly from XAPI using credentials
 * provided by the parent process.
 *
 * The process terminates gracefully by:
 * 1. Closing the HTTP server (stops accepting new connections)
 * 2. Disconnecting from the parent IPC channel
 * 3. Letting the event loop drain naturally
 *
 * The heavy lifting lives in the `./server/*` modules: request/response IPC
 * correlation in `request-client.mjs`, RRD fetching in `rrd-fetcher.mjs`, and
 * metrics gathering/assembly in `collect-metrics.mjs`. This file is the slim
 * entry: process lifecycle, IPC routing, and the HTTP `/metrics` endpoint.
 */

import { createServer, type Server } from 'node:http'
import { createLogger } from '@xen-orchestra/log'

import type { IpcMessage, ServerConfiguration } from './types/ipc.mjs'
import { collectMetrics } from './server/collect-metrics.mjs'
import { httpsAgent } from './server/rrd-fetcher.mjs'
import { handleParentResponse, rejectAllPending, sendToParent } from './server/request-client.mjs'

const logger = createLogger('xo:xo-server-openmetrics:child')

// ============================================================================
// State
// ============================================================================

let server: Server | undefined
let configuration: ServerConfiguration | undefined
let isShuttingDown = false

// ============================================================================
// IPC Communication
// ============================================================================

function handleParentMessage(rawMessage: unknown): void {
  const message = rawMessage as IpcMessage

  switch (message.type) {
    case 'INIT':
      handleInit(message.payload as ServerConfiguration).catch(err => logger.error('Init failed', { error: err }))
      break

    case 'SHUTDOWN':
      handleShutdown().catch(err => logger.error('Shutdown failed', { error: err }))
      break

    case 'XAPI_CREDENTIALS':
    case 'SR_DATA':
    case 'VDI_DATA':
    case 'HOST_STATUS':
    case 'VM_STATUS':
    case 'XO_METRICS':
    case 'XOSTOR_DATA':
    case 'XOSTOR_ALARMS':
    case 'XOSTOR_SMART':
    case 'XOSTOR_UPDATES':
      handleParentResponse(message)
      break

    default:
      logger.warn('Unknown message type from parent', { type: message.type })
  }
}

async function handleInit(config: ServerConfiguration): Promise<void> {
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
    await cleanup()
  }
}

async function handleShutdown(): Promise<void> {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true
  process.exitCode = 0
  await cleanup()
}

async function cleanup(): Promise<void> {
  // Cancel all pending requests
  rejectAllPending()

  // Close the HTTP server
  if (server !== undefined) {
    server.close()
    server = undefined
  }

  // Close the HTTPS agent to release resources
  await httpsAgent.close()

  // Disconnect from parent IPC channel - this allows the process to exit naturally
  if (process.connected) {
    process.disconnect()
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

async function startServer(): Promise<void> {
  if (configuration === undefined) {
    throw new Error('Server not configured')
  }

  const { port, bindAddress, secret } = configuration

  server = createServer(async (req, res) => {
    const url = req.url ?? '/'
    const method = req.method ?? 'GET'

    // Health check endpoint
    if (url === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }
    const auth = req.headers.authorization?.trim()
    if (!auth) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Query is not authenticated' }))
      return
    }

    if (auth !== `Bearer ${secret}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Query authentication does not match server setting' }))
      return
    }

    // Metrics endpoint
    if (url === '/metrics' && method === 'GET') {
      try {
        const metrics = await collectMetrics()
        res.writeHead(200, {
          'Content-Type': 'application/openmetrics-text; version=1.0.0; charset=utf-8',
        })
        res.end(metrics)
      } catch (error) {
        logger.warn('Failed to collect metrics', { error })
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

  return new Promise<void>((resolve, reject) => {
    server!.on('error', (error: Error) => {
      reject(error)
    })

    server!.listen(port, bindAddress, () => {
      resolve()
    })
  })
}

// ============================================================================
// Process Event Handlers
// ============================================================================

// Set up IPC message handler
process.on('message', handleParentMessage)

// Handle parent disconnect (parent process died)
process.on('disconnect', () => {
  if (!isShuttingDown) {
    process.exitCode = 1
    cleanup().catch(err => logger.error('Cleanup failed during disconnect', { error: err }))
  }
})

// Handle process signals
process.on('SIGTERM', () => {
  handleShutdown().catch(err => logger.error('Shutdown failed on SIGTERM', { error: err }))
})

process.on('SIGINT', () => {
  handleShutdown().catch(err => logger.error('Shutdown failed on SIGINT', { error: err }))
})

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error })
  sendToParent({ type: 'ERROR', error: error.message })
  process.exitCode = 1
  cleanup().catch(err => logger.error('Cleanup failed after uncaught exception', { error: err }))
})

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', { reason })
  sendToParent({
    type: 'ERROR',
    error: reason instanceof Error ? reason.message : String(reason),
  })
})
