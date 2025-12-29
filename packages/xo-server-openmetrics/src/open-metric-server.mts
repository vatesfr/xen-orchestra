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
import {
  formatAllPoolsToOpenMetrics,
  formatSrMetrics,
  formatToOpenMetrics,
  type SrData,
} from './openmetric-formatter.mjs'

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
  secret: string
}

interface HostCredentials {
  hostId: string
  hostAddress: string
  hostLabel: string
  poolId: string
  poolLabel: string
  sessionId: string
  protocol: string
}

// Label lookup types for enriching metrics with human-readable names
interface VmLabelInfo {
  name_label: string
  vbdDeviceToVdiName: Record<string, string>
  vifIndexToNetworkName: Record<string, string>
}

interface HostLabelInfo {
  name_label: string
  pifDeviceToNetworkName: Record<string, string>
}

interface SrLabelInfo {
  name_label: string
}

interface LabelLookupData {
  vms: Record<string, VmLabelInfo>
  hosts: Record<string, HostLabelInfo>
  srs: Record<string, SrLabelInfo>
  srSuffixToUuid: Record<string, string>
}

interface XapiCredentialsPayload {
  hosts: HostCredentials[]
  labels: LabelLookupData
}

interface SrDataPayload {
  srs: SrData[]
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
      handleInit(message.payload as ServerConfiguration).catch(err => logger.error('Init failed', { error: err }))
      break

    case 'SHUTDOWN':
      handleShutdown().catch(err => logger.error('Shutdown failed', { error: err }))
      break

    case 'XAPI_CREDENTIALS':
      handleCredentialsResponse(message)
      break

    case 'SR_DATA':
      handleSrDataResponse(message)
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

function handleSrDataResponse(message: IpcMessage): void {
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

async function requestSrData(): Promise<SrDataPayload> {
  const requestId = `sr-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for SR data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as SrDataPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_SR_DATA', requestId })
  })
}

// ============================================================================
// RRD Data Fetching
// ============================================================================

/**
 * Fetch and parse RRD data from a single host.
 *
 * Each host in a XCP-ng/XenServer pool serves RRD data for:
 * - The host itself
 * - All VMs running on that host
 *
 * @param host - Host credentials including address, sessionId, poolId, labels
 * @returns ParsedRrdData or null on error
 */
async function fetchRrdFromHost(host: HostCredentials): Promise<ParsedRrdData | null> {
  const { hostAddress, hostLabel, sessionId, poolId, poolLabel, protocol } = host

  // Calculate start time: current time minus 2 intervals (to ensure we get recent data)
  const now = Math.floor(Date.now() / 1000)
  const interval = 60
  const start = now - 2 * interval

  // Build RRD URL with query parameters
  // cf=AVERAGE is required (cf=LAST is not supported by XenServer rrd_updates endpoint)
  // Using start parameter to get recent data points
  const baseUrl = `${protocol}//${hostAddress}`
  const url = new URL('/rrd_updates', baseUrl)
  url.searchParams.set('session_id', sessionId)
  url.searchParams.set('cf', 'AVERAGE')
  url.searchParams.set('interval', String(interval))
  url.searchParams.set('start', String(start))
  url.searchParams.set('host', 'true')
  url.searchParams.set('json', 'true')

  try {
    const response = await undiciRequest(url, {
      method: 'GET',
      dispatcher: httpsAgent,
      headersTimeout: RRD_FETCH_TIMEOUT_MS,
      bodyTimeout: RRD_FETCH_TIMEOUT_MS,
    })

    if (response.statusCode !== 200) {
      // Drain the body to release the connection
      await response.body.text()
      logger.warn('RRD fetch failed', { hostLabel, poolLabel, statusCode: response.statusCode })
      return null
    }

    const text = await response.body.text()

    try {
      // Parse RRD response using the dedicated parser (handles JSON5 fallback)
      return parseRrdResponse(text, poolId)
    } catch (parseError) {
      logger.warn('RRD parse failed', { hostLabel, poolLabel, error: parseError })
      return null
    }
  } catch (error) {
    logger.warn('RRD fetch error', { hostLabel, poolLabel, error, url })
    return null
  }
}

// ============================================================================
// Metrics Collection
// ============================================================================

/**
 * Collect metrics from all hosts in all connected pools.
 *
 * Fetches RRD data from each host with bounded concurrency,
 * parses and transforms to OpenMetrics format.
 * Also collects SR capacity metrics from XO objects.
 *
 * @returns OpenMetrics-formatted string
 */
async function collectMetrics(): Promise<string> {
  const credentials = await requestXapiCredentials()
  const srData = await requestSrData()

  logger.debug('Collecting metrics', { hostCount: credentials.hosts.length, srCount: srData.srs.length })

  if (credentials.hosts.length === 0) {
    return '# No connected hosts\n# EOF'
  }

  // Collect parsed RRD data from all hosts
  const rrdDataList: ParsedRrdData[] = []
  try {
    await asyncEach(
      credentials.hosts,
      async host => {
        const rrdData = await fetchRrdFromHost(host)
        if (rrdData !== null) {
          logger.debug('RRD data fetched', {
            hostLabel: host.hostLabel,
            poolLabel: host.poolLabel,
            metricCount: rrdData.metrics.length,
          })
          rrdDataList.push(rrdData)
        }
      },
      { concurrency: RRD_FETCH_CONCURRENCY, stopOnError: false }
    )
  } catch (error) {
    logger.warn('Error collecting RRD metrics', { error })
  }

  // Build pool connection metrics (deduplicate pools from hosts)
  const poolMetrics: string[] = []
  poolMetrics.push('# HELP xcp_pool_connected Indicates if a pool is connected (1) or not (0)')
  poolMetrics.push('# TYPE xcp_pool_connected gauge')

  const seenPools = new Set<string>()
  for (const host of credentials.hosts) {
    if (!seenPools.has(host.poolId)) {
      seenPools.add(host.poolId)
      poolMetrics.push(`xcp_pool_connected{pool_id="${host.poolId}",pool_name="${host.poolLabel}"} 1`)
    }
  }

  // Format all RRD data to OpenMetrics
  logger.debug('Formatting RRD data', {
    hostCount: rrdDataList.length,
    totalMetrics: rrdDataList.reduce((sum, d) => sum + d.metrics.length, 0),
  })
  const rrdMetrics = formatAllPoolsToOpenMetrics(rrdDataList, credentials)
  logger.debug('Formatted metrics', { outputLength: rrdMetrics.length })

  // Format SR capacity metrics
  const srMetrics = formatSrMetrics(srData.srs)
  const srMetricsOutput = srMetrics.length > 0 ? formatToOpenMetrics(srMetrics) : ''
  logger.debug('Formatted SR metrics', { srCount: srMetrics.length })

  // Combine pool metrics with RRD metrics and SR metrics
  // Remove the # EOF from rrdMetrics if present (we'll add our own)
  const rrdMetricsWithoutEof = rrdMetrics.replace(/\n# EOF$/, '')

  const allMetricsSections = [poolMetrics.join('\n')]

  if (rrdMetricsWithoutEof !== '') {
    allMetricsSections.push(rrdMetricsWithoutEof)
  }

  if (srMetricsOutput !== '') {
    allMetricsSections.push(srMetricsOutput)
  }

  return allMetricsSections.join('\n') + '\n# EOF'
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
