/**
 * XOSTOR (LINSTOR-backed SR) parsing & derivation helpers.
 *
 * Pure functions moved verbatim out of `index.mts`. They derive XOSTOR
 * topology (host IDs, LINSTOR group name, replica states) from XO objects and
 * normalize raw XAPI plugin responses (`linstor-manager.healthCheck`,
 * `smartctl.py`, `updater.py`) into the typed payloads consumed by the
 * formatters.
 *
 * Pure (no instance/process state) — safe to import from either process.
 */

import type { XoPbd, XoSr } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'

import type { XostorHealthCheckRaw, XostorSmartDevice, XostorUpdatePackage } from '../types/xostor.mjs'

const logger = createLogger('xo:xo-server-openmetrics:xostor')

/**
 * RPMs whose updates are relevant to a running XOSTOR cluster.
 *
 * Each entry must exactly match the `name` field reported by `updater.py
 * check_update`, since matching is done by string equality. Update this set
 * (and the parser) in lock-step if XCP-ng renames a LINSTOR-related package.
 */
export const XOSTOR_UPDATE_PACKAGES: ReadonlySet<string> = new Set([
  'xcp-ng-linstor',
  'xcp-ng-release-linstor',
  'linstor-satellite',
  'linstor-controller',
  'xcp-ng-xapi-plugins',
])

/**
 * Set of host IDs that back a XOSTOR SR via its PBDs.
 *
 * Each PBD links one host to one SR; the set deduplicates in case the same
 * host shows up via multiple PBDs (rare but possible).
 */
export function xostorHostIdsFromPbds(sr: XoSr, allPbds: Record<string, XoPbd>): Set<string> {
  const hostIds = new Set<string>()
  for (const pbdId of sr.$PBDs) {
    const pbd = allPbds[pbdId]
    if (pbd !== undefined) {
      hostIds.add(pbd.host)
    }
  }
  return hostIds
}

export function findLinstorGroupName(sr: XoSr, allPbds: Record<string, XoPbd>): string | undefined {
  for (const pbdId of sr.$PBDs) {
    const pbd = allPbds[pbdId]
    if (pbd === undefined) continue
    const cfg = pbd.device_config as Record<string, unknown>
    const groupName = cfg['group-name']
    if (typeof groupName === 'string' && groupName !== '') {
      return groupName
    }
  }
  return undefined
}

/**
 * Aggregate the `disk-state` of every replica across all resources.
 *
 * For each resource → each node → first volume → `disk-state`, increment a
 * bucket. A missing or non-string `disk-state` collapses into the `Unknown`
 * bucket so that the sum of all buckets equals the total replica count.
 */
export function countReplicaStates(resources: Record<string, unknown>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const resource of Object.values(resources)) {
    if (resource === null || typeof resource !== 'object') continue
    const nodes = (resource as { nodes?: unknown }).nodes
    if (nodes === null || typeof nodes !== 'object') continue
    for (const nodeInfo of Object.values(nodes as Record<string, unknown>)) {
      if (nodeInfo === null || typeof nodeInfo !== 'object') continue
      const volumes = (nodeInfo as { volumes?: unknown }).volumes
      let state: string = 'Unknown'
      if (Array.isArray(volumes) && volumes.length > 0) {
        const first = volumes[0]
        if (first !== null && typeof first === 'object') {
          const rawState = (first as Record<string, unknown>)['disk-state']
          if (typeof rawState === 'string' && rawState !== '') {
            state = rawState
          }
        }
      }
      counts[state] = (counts[state] ?? 0) + 1
    }
  }
  return counts
}

/**
 * Try to coerce a XAPI plugin response to a `Record<string, unknown>`.
 *
 * Logs a warning and returns `undefined` when the payload is not a string of
 * valid JSON object or not an object at all. Callers decide whether to
 * surface this as a soft failure (return empty) or hard failure (throw).
 */
function tryParsePluginJson(raw: unknown, pluginLabel: string, contextId: string): Record<string, unknown> | undefined {
  let value: unknown
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch (err) {
      logger.warn(`Failed to JSON-parse ${pluginLabel} response`, { contextId, error: err })
      return undefined
    }
  } else {
    value = raw
  }
  if (value === null || typeof value !== 'object') {
    logger.warn(`Unexpected ${pluginLabel} shape (not an object)`, { contextId })
    return undefined
  }
  return value as Record<string, unknown>
}

/**
 * Validate and normalize the `smartctl.py health` plugin response.
 *
 * Real shape (confirmed against XCP-ng 8.3 and the consumer in
 * `xo-web/src/xo-app/host/tab-advanced.js`): `{ [device]: string }` where
 * the value is the overall-health string directly (e.g. `'PASSED'`).
 * Older or variant builds may wrap each entry in `{ status: '...' }`; both
 * shapes are accepted. Malformed entries collapse to `'UNKNOWN'`.
 *
 * Throws when the response is not a JSON object at all (caller catches and
 * surfaces via `up: false`).
 */
export function parseXostorSmartHealth(raw: unknown, hostUuid: string): XostorSmartDevice[] {
  const obj = tryParsePluginJson(raw, 'smartctl.py', hostUuid)
  if (obj === undefined) {
    throw new Error('smartctl.py returned malformed payload')
  }

  const devices: XostorSmartDevice[] = []
  for (const [device, entry] of Object.entries(obj)) {
    let status: string = 'UNKNOWN'
    if (typeof entry === 'string' && entry !== '') {
      status = entry
    } else if (entry !== null && typeof entry === 'object') {
      const rawStatus = (entry as Record<string, unknown>).status
      if (typeof rawStatus === 'string' && rawStatus !== '') {
        status = rawStatus
      }
    }
    devices.push({ device, status })
  }
  return devices
}

/**
 * Validate `updater.py check_update` and extract XOSTOR-relevant packages.
 *
 * Expected shape: `{ [uuid: string]: { name?: string, ... } }` or an object
 * with a top-level `error` field on failure (which we propagate as a throw
 * so the host gets `up=false`).
 *
 * Matching against `XOSTOR_UPDATE_PACKAGES` is by exact equality of
 * `entry.name`. Duplicates are deduped here; if multiple advisories target
 * the same package, only one bucket is emitted.
 */
export function parseXostorCheckUpdate(raw: unknown, hostUuid: string): XostorUpdatePackage[] {
  const obj = tryParsePluginJson(raw, 'updater.py', hostUuid)
  if (obj === undefined) {
    throw new Error('updater.py returned malformed payload')
  }
  if (obj.error !== undefined && obj.error !== null) {
    throw new Error(`updater.py error: ${String(obj.error)}`)
  }

  const seen = new Set<string>()
  const packages: XostorUpdatePackage[] = []
  for (const entry of Object.values(obj)) {
    if (entry === null || typeof entry !== 'object') continue
    const name = (entry as Record<string, unknown>).name
    if (typeof name !== 'string' || name === '') continue
    if (!XOSTOR_UPDATE_PACKAGES.has(name)) continue
    if (seen.has(name)) continue
    seen.add(name)
    packages.push({ package: name })
  }
  return packages
}

export function parseXostorHealthCheck(raw: unknown, srUuid: string): XostorHealthCheckRaw {
  const obj = tryParsePluginJson(raw, 'linstor-manager.healthCheck', srUuid)
  if (obj === undefined) {
    return {}
  }
  const result: XostorHealthCheckRaw = {}
  if (obj.nodes !== undefined && typeof obj.nodes === 'object' && obj.nodes !== null) {
    result.nodes = obj.nodes as Record<string, unknown>
  }
  if (obj.resources !== undefined && typeof obj.resources === 'object' && obj.resources !== null) {
    result.resources = obj.resources as Record<string, unknown>
  }
  return result
}
