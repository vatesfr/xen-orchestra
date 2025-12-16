/**
 * RRD Parser Module
 *
 * Parses RRD responses from XAPI /rrd_updates endpoint.
 * Handles JSON and JSON5 formats (for XAPI < 23.31).
 * Manages special values like NaN and Infinity.
 */

import JSON5 from 'json5'

// ============================================================================
// Types
// ============================================================================

/** Raw RRD response metadata from XAPI */
export interface RrdMeta {
  start: number
  step: number
  end: number
  rows: number
  columns: number
  legend: string[]
}

/** Raw RRD data point from XAPI */
export interface RrdDataPoint {
  t: number
  values: (number | string)[]
}

/** Raw RRD response from XAPI /rrd_updates endpoint */
export interface RrdResponse {
  meta: RrdMeta
  data: RrdDataPoint[]
}

/** Parsed legend entry */
export interface ParsedLegend {
  /** Consolidation function (AVERAGE, MAX, etc.) */
  cf: string
  /** Object type: host, vm, or sr */
  objectType: 'host' | 'vm' | 'sr'
  /** UUID of the object */
  uuid: string
  /** Metric name (e.g., cpu_avg, memory_free_kib) */
  metricName: string
  /** Original raw legend string */
  rawLegend: string
}

/** Parsed metric with value */
export interface ParsedMetric {
  /** Parsed legend information */
  legend: ParsedLegend
  /** Metric value (null if NaN/Infinity) */
  value: number | null
  /** Timestamp in seconds */
  timestamp: number
}

/** Parsed RRD data for a single pool */
export interface ParsedRrdData {
  /** Pool UUID */
  poolId: string
  /** Timestamp of the data in seconds */
  timestamp: number
  /** All parsed metrics */
  metrics: ParsedMetric[]
}

// ============================================================================
// Constants
// ============================================================================

/** Regex to parse legend format: "AVERAGE:type:uuid:metric_name" */
const LEGEND_REGEX = /^([A-Z]+):([^:]+):([^:]+):(.+)$/

/** Valid object types in RRD data */
const VALID_OBJECT_TYPES = new Set(['host', 'vm', 'sr'])

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse a number from RRD response, handling XAPI 23.31+ string encoding.
 *
 * Starting from XAPI 23.31, numbers in the JSON payload are encoded as
 * strings to support NaN, Infinity and -Infinity values.
 *
 * @param value - Number or string from RRD response
 * @returns Parsed number or null if NaN/Infinity/invalid
 */
export function parseNumber(value: number | string): number | null {
  if (typeof value === 'string') {
    // Empty strings and non-numeric strings are invalid
    const trimmed = value.trim()
    if (trimmed === '') {
      return null
    }

    // XAPI 23.31+ encodes numbers as strings
    value = Number(value)
  }

  // Return null for NaN and Infinity (they can't be represented in OpenMetrics)
  if (!Number.isFinite(value)) {
    return null
  }

  return value
}

/**
 * Parse a legend string into structured format.
 *
 * Legend format: "AVERAGE:type:uuid:metric_name"
 * Example: "AVERAGE:host:abc-123-def:cpu_avg"
 *
 * @param legend - Raw legend string from RRD metadata
 * @returns ParsedLegend or null if the format is invalid
 */
export function parseLegend(legend: string): ParsedLegend | null {
  const match = LEGEND_REGEX.exec(legend)

  if (match === null) {
    return null
  }

  const [, cf, objectType, uuid, metricName] = match

  // Validate object type
  if (!VALID_OBJECT_TYPES.has(objectType)) {
    return null
  }

  return {
    cf,
    objectType: objectType as 'host' | 'vm' | 'sr',
    uuid,
    metricName,
    rawLegend: legend,
  }
}

/**
 * Parse raw RRD JSON text with JSON5 fallback for older XAPI versions.
 *
 * XAPI < 23.31 may return invalid JSON (using NaN without quotes),
 * so we fall back to JSON5 which handles these cases.
 *
 * @param text - Raw response text from /rrd_updates endpoint
 * @returns Parsed RrdResponse
 * @throws Error if parsing fails with both JSON and JSON5
 */
export function parseRrdText(text: string): RrdResponse {
  try {
    // Try standard JSON first (XAPI 23.31+)
    return JSON.parse(text) as RrdResponse
  } catch {
    // Fall back to JSON5 for older XAPI versions
    return JSON5.parse(text) as RrdResponse
  }
}

/**
 * Extract all valid metrics from an RRD response.
 *
 * @param rrd - Parsed RRD response
 * @param poolId - Pool UUID for labeling
 * @returns ParsedRrdData with all valid metrics
 */
export function parseRrdData(rrd: RrdResponse, poolId: string): ParsedRrdData {
  const { meta, data } = rrd

  // Use the most recent data point (last in array after reversal)
  // RRD data comes newest-first, we want the most recent
  if (data.length === 0) {
    return {
      poolId,
      timestamp: meta.end,
      metrics: [],
    }
  }

  // Get the most recent data point
  const latestData = data[data.length - 1]
  const timestamp = latestData.t

  const metrics: ParsedMetric[] = []

  for (let i = 0; i < meta.legend.length; i++) {
    const legend = parseLegend(meta.legend[i])

    if (legend === null) {
      // Skip unparseable legend entries
      continue
    }

    const value = parseNumber(latestData.values[i])

    metrics.push({
      legend,
      value,
      timestamp,
    })
  }

  return {
    poolId,
    timestamp,
    metrics,
  }
}

/**
 * Parse raw RRD text and extract metrics in one step.
 *
 * Convenience function that combines parseRrdText and parseRrdData.
 *
 * @param text - Raw response text from /rrd_updates endpoint
 * @param poolId - Pool UUID for labeling
 * @returns ParsedRrdData with all valid metrics
 */
export function parseRrdResponse(text: string, poolId: string): ParsedRrdData {
  const rrd = parseRrdText(text)
  return parseRrdData(rrd, poolId)
}
