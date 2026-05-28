/**
 * RRD data fetching — child process.
 *
 * Fetches and parses RRD data from individual hosts over HTTPS (undici),
 * tolerating self-signed certificates. Owns the shared HTTPS agent so the
 * entry can release it during cleanup.
 */

import { Agent, request as undiciRequest } from 'undici'
import { createLogger } from '@xen-orchestra/log'

import { parseRrdResponse, type ParsedRrdData } from '../rrd-parser.mjs'
import type { HostCredentials } from '../types/ipc.mjs'

const logger = createLogger('xo:xo-server-openmetrics:child')

// ============================================================================
// Constants
// ============================================================================

const RRD_FETCH_TIMEOUT_MS = 10_000

// HTTPS agent that accepts self-signed certificates (common in XenServer)
export const httpsAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
})

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
export async function fetchRrdFromHost(host: HostCredentials): Promise<ParsedRrdData | null> {
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
