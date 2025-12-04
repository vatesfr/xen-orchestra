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
    cleanup()
  }
}

function handleShutdown(): void {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true
  process.exitCode = 0
  cleanup()
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

function cleanup(): void {
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

interface RrdMeta {
  start: number
  step: number
  end: number
  rows: number
  columns: number
  legend: string[]
}

interface RrdDataPoint {
  t: number
  values: (number | string)[]
}

interface RrdResponse {
  meta: RrdMeta
  data: RrdDataPoint[]
}

async function fetchRrdFromPool(pool: PoolCredentials): Promise<RrdResponse | null> {
  const { masterUrl, sessionId } = pool

  // Build RRD URL with query parameters
  const url = new URL('/rrd_updates', masterUrl)
  url.searchParams.set('session_id', sessionId)
  url.searchParams.set('cf', 'AVERAGE')
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
      logger.warn('RRD fetch failed', { poolId: pool.poolId, statusCode: response.statusCode })
      return null
    }

    const text = await response.body.text()
    try {
      return JSON.parse(text) as RrdResponse
    } catch (parseError) {
      logger.warn('RRD JSON parse failed', { poolId: pool.poolId, error: parseError })
      return null
    }
  } catch (error) {
    logger.warn('RRD fetch error', { poolId: pool.poolId, error })
    return null
  }
}

// ============================================================================
// OpenMetrics Formatting
// ============================================================================

function formatMetricName(legend: string): { type: string; uuid: string; metric: string } | null {
  // Legend format: "AVERAGE:type:uuid:metric_name"
  // Example: "AVERAGE:host:abc123:cpu_avg"
  const match = /^AVERAGE:([^:]+):([^:]+):(.+)$/.exec(legend)
  if (match === null) {
    return null
  }
  return {
    type: match[1],
    uuid: match[2],
    metric: match[3],
  }
}

function sanitizeMetricName(name: string): string {
  // OpenMetrics requires metric names to match [a-zA-Z_:][a-zA-Z0-9_:]*
  return name.replace(/[^a-zA-Z0-9_:]/g, '_')
}

function formatRrdToOpenMetrics(rrd: RrdResponse, poolId: string): string {
  const lines: string[] = []
  const { meta, data } = rrd

  if (data.length === 0) {
    return ''
  }

  // Use the most recent data point
  const latestData = data[data.length - 1]
  const timestamp = latestData.t * 1000 // Convert to milliseconds

  // Group metrics by name for HELP/TYPE declarations
  const metricsByName = new Map<string, Array<{ labels: string; value: number | string }>>()

  for (let i = 0; i < meta.legend.length; i++) {
    const parsed = formatMetricName(meta.legend[i])
    if (parsed === null) {
      continue
    }

    const { type, uuid, metric } = parsed
    const value = latestData.values[i]

    // Skip NaN and Infinity values
    if (typeof value === 'string') {
      const numValue = parseFloat(value)
      if (!Number.isFinite(numValue)) {
        continue
      }
    } else if (!Number.isFinite(value)) {
      continue
    }

    const metricName = `xo_${sanitizeMetricName(type)}_${sanitizeMetricName(metric)}`
    const labels = `pool_id="${poolId}",${type}_uuid="${uuid}"`

    if (!metricsByName.has(metricName)) {
      metricsByName.set(metricName, [])
    }
    metricsByName.get(metricName)!.push({ labels, value })
  }

  // Output metrics in OpenMetrics format
  for (const [metricName, values] of metricsByName) {
    lines.push(`# HELP ${metricName} XenServer ${metricName} metric`)
    lines.push(`# TYPE ${metricName} gauge`)

    for (const { labels, value } of values) {
      lines.push(`${metricName}{${labels}} ${value} ${timestamp}`)
    }
  }

  return lines.join('\n')
}

// ============================================================================
// Metrics Collection
// ============================================================================

async function collectMetrics(): Promise<string> {
  const credentials = await requestXapiCredentials()

  if (credentials.pools.length === 0) {
    return '# No connected pools\n'
  }

  const results: string[] = []

  // Add header
  results.push('# HELP xo_pool_connected Indicates if a pool is connected (1) or not (0)')
  results.push('# TYPE xo_pool_connected gauge')

  for (const pool of credentials.pools) {
    results.push(`xo_pool_connected{pool_id="${pool.poolId}"} 1`)
  }

  // Fetch RRD data from all pools with bounded concurrency
  const rrdResults: string[] = []
  await asyncEach(
    credentials.pools,
    async pool => {
      const rrd = await fetchRrdFromPool(pool)
      if (rrd !== null) {
        const formatted = formatRrdToOpenMetrics(rrd, pool.poolId)
        if (formatted !== '') {
          rrdResults.push(formatted)
        }
      }
    },
    { concurrency: RRD_FETCH_CONCURRENCY, stopOnError: false }
  )
  results.push(...rrdResults)

  // Add EOF marker for OpenMetrics format
  results.push('# EOF')

  return results.join('\n')
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
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error })
  sendToParent({ type: 'ERROR', error: error.message })
  process.exitCode = 1
  cleanup()
})

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', { reason })
  sendToParent({
    type: 'ERROR',
    error: reason instanceof Error ? reason.message : String(reason),
  })
})
