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
 */

import { createServer, type Server } from 'node:http'
import { Agent, request as undiciRequest } from 'undici'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

import { parseRrdResponse, type ParsedRrdData } from './rrd-parser.mjs'
import { formatAllPoolsToOpenMetrics } from './openmetric-formatter.mjs'

const logger = createLogger('xo:xo-server-openmetrics:child')

// ============================================================================
// Types
// ============================================================================

interface IpcMessage {
  type: string
  payload?: unknown
  requestId?: string
  error?: string
}

interface ServerConfiguration {
  port: number
  bindAddress: string
}

interface PoolCredentials {
  poolId: string
  masterUrl: string
  sessionId: string
}

interface XapiCredentialsPayload {
  pools: PoolCredentials[]
}

interface PendingRequest<T> {
  resolve: (value: T) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

// ============================================================================
// State
// ============================================================================

let server: Server | undefined
let configuration: ServerConfiguration | undefined
const pendingRequests = new Map<string, PendingRequest<unknown>>()
let requestIdCounter = 0
let isShuttingDown = false

// ============================================================================
// Constants
// ============================================================================

const IPC_REQUEST_TIMEOUT_MS = 30_000
const RRD_FETCH_TIMEOUT_MS = 10_000
const RRD_FETCH_CONCURRENCY = 5 // Limit parallel RRD requests to avoid overwhelming XAPI

// HTTPS agent that accepts self-signed certificates (common in XenServer)
const httpsAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
})

// ============================================================================
// IPC Communication
// ============================================================================

function sendToParent(message: IpcMessage): void {
  if (process.send !== undefined && process.connected) {
    process.send(message)
  }
}

function handleParentMessage(rawMessage: unknown): void {
  const message = rawMessage as IpcMessage

  switch (message.type) {
    case 'INIT':
      handleInit(message.payload as ServerConfiguration)
      break

    case 'SHUTDOWN':
      handleShutdown()
      break

    case 'XAPI_CREDENTIALS':
      handleCredentialsResponse(message)
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

function handleCredentialsResponse(message: IpcMessage): void {
  const requestId = message.requestId
  if (requestId === undefined) {
    return
  }

  const pending = pendingRequests.get(requestId)
  if (pending !== undefined) {
    clearTimeout(pending.timer)
    pendingRequests.delete(requestId)
    pending.resolve(message.payload)
  }
}

async function cleanup(): Promise<void> {
  // Cancel all pending requests
  for (const pending of pendingRequests.values()) {
    clearTimeout(pending.timer)
    pending.reject(new Error('Server shutting down'))
  }
  pendingRequests.clear()

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
// XAPI Credentials Request
// ============================================================================

async function requestXapiCredentials(): Promise<XapiCredentialsPayload> {
  const requestId = `creds-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XAPI credentials from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XapiCredentialsPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XAPI_CREDENTIALS', requestId })
  })
}

// ============================================================================
// RRD Data Fetching
// ============================================================================

/**
 * Fetch and parse RRD data from a pool.
 *
 * @param pool - Pool credentials
 * @returns ParsedRrdData or null on error
 */
async function fetchRrdFromPool(pool: PoolCredentials): Promise<ParsedRrdData | null> {
  const { masterUrl, sessionId, poolId } = pool

  // Build RRD URL with query parameters
  // cf=LAST returns the most recent value (vs AVERAGE which averages over the interval)
  // This is more suitable for real-time monitoring with Prometheus/Grafana
  const url = new URL('/rrd_updates', masterUrl)
  url.searchParams.set('session_id', sessionId)
  url.searchParams.set('cf', 'LAST')
  url.searchParams.set('interval', '60')
  url.searchParams.set('host', 'true')
  url.searchParams.set('vm_uuid', 'all')
  url.searchParams.set('json', 'true')

  try {
    const response = await undiciRequest(url.toString(), {
      method: 'GET',
      dispatcher: httpsAgent,
      headersTimeout: RRD_FETCH_TIMEOUT_MS,
      bodyTimeout: RRD_FETCH_TIMEOUT_MS,
    })

    if (response.statusCode !== 200) {
      logger.warn('RRD fetch failed', { poolId, statusCode: response.statusCode })
      return null
    }

    const text = await response.body.text()

    try {
      // Parse RRD response using the dedicated parser (handles JSON5 fallback)
      return parseRrdResponse(text, poolId)
    } catch (parseError) {
      logger.warn('RRD parse failed', { poolId, error: parseError })
      return null
    }
  } catch (error) {
    logger.warn('RRD fetch error', { poolId, error })
    return null
  }
}

// ============================================================================
// Metrics Collection
// ============================================================================

/**
 * Collect metrics from all connected pools.
 *
 * Fetches RRD data from all pools with bounded concurrency,
 * parses and transforms to OpenMetrics format.
 *
 * @returns OpenMetrics-formatted string
 */
async function collectMetrics(): Promise<string> {
  const credentials = await requestXapiCredentials()

  if (credentials.pools.length === 0) {
    return '# No connected pools\n# EOF'
  }

  // Collect parsed RRD data from all pools
  const rrdDataList: ParsedRrdData[] = []

  await asyncEach(
    credentials.pools,
    async pool => {
      const rrdData = await fetchRrdFromPool(pool)
      if (rrdData !== null) {
        rrdDataList.push(rrdData)
      }
    },
    { concurrency: RRD_FETCH_CONCURRENCY, stopOnError: false }
  )

  // Build pool connection metrics
  const poolMetrics: string[] = []
  poolMetrics.push('# HELP xcp_pool_connected Indicates if a pool is connected (1) or not (0)')
  poolMetrics.push('# TYPE xcp_pool_connected gauge')

  for (const pool of credentials.pools) {
    poolMetrics.push(`xcp_pool_connected{pool_id="${pool.poolId}"} 1`)
  }

  // Format all RRD data to OpenMetrics
  const rrdMetrics = formatAllPoolsToOpenMetrics(rrdDataList)

  // Combine pool metrics with RRD metrics
  // Remove the # EOF from rrdMetrics if present (we'll add our own)
  const rrdMetricsWithoutEof = rrdMetrics.replace(/\n# EOF$/, '')

  if (rrdMetricsWithoutEof === '' || rrdMetricsWithoutEof === '# EOF') {
    return poolMetrics.join('\n') + '\n# EOF'
  }

  return poolMetrics.join('\n') + '\n' + rrdMetricsWithoutEof + '\n# EOF'
}

// ============================================================================
// HTTP Server
// ============================================================================

async function startServer(): Promise<void> {
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
        const metrics = await collectMetrics()
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
