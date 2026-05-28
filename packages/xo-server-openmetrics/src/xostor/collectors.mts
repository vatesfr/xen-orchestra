/**
 * XOSTOR (LINSTOR-backed SR) data collectors — parent-process side.
 *
 * Free functions extracted verbatim from `OpenMetricsPlugin`. They perform the
 * XAPI plugin calls (`linstor-manager.healthCheck`, `smartctl.py health`,
 * `updater.py check_update`) and the in-memory alarm scan, then normalize the
 * results via the pure parsers in `./parsers.mjs`.
 *
 * The only changes from the original methods are the mechanical substitutions
 * `this.#xo` → the `xo` parameter and `this.#fetchHost*(…)` /
 * `this.#collect*()` → the corresponding free-function calls. The TTL-cache
 * wrappers (`getXostorData`/`getXostorSmartHealth`/`getXostorUpdates`) take a
 * `XostorCollectorDeps` object holding `xo` plus the three caches.
 */

import type { XoApp, XoHost, XoMessage, XoPbd, XoPool, XoSr } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'

import type { TtlCache } from '../utils/ttl-cache.mjs'
import { withTimeout } from '../utils/with-timeout.mjs'
import {
  countReplicaStates,
  findLinstorGroupName,
  parseXostorCheckUpdate,
  parseXostorHealthCheck,
  parseXostorSmartHealth,
  xostorHostIdsFromPbds,
} from './parsers.mjs'
import type {
  XostorAlarmEntry,
  XostorAlarmsItem,
  XostorAlarmsPayload,
  XostorClusterItem,
  XostorNodeItem,
  XostorPayload,
  XostorSmartHost,
  XostorSmartPayload,
  XostorUpdateItem,
  XostorUpdatesPayload,
} from '../types/xostor.mjs'

const logger = createLogger('xo:xo-server-openmetrics')

/**
 * Names of XAPI message types treated as "alarms" by XO's web UI.
 *
 * Mirrors `isAlarm` in `packages/xo-server/src/utils.mjs`. Kept as a local
 * constant because `xo-server-openmetrics` is a separate package without a
 * runtime dependency on `xo-server`. Update both files in lock-step if XO
 * grows the alarm-name set.
 */
const XAPI_ALARM_NAMES = new Set<string>(['ALARM', 'BOND_STATUS_CHANGED', 'MULTIPATH_PERIODIC_ALERT'])

/** Timeout for a single XOSTOR healthCheck plugin call (ms). */
const XOSTOR_HEALTHCHECK_TIMEOUT_MS = 8_000

/** Timeout for a single `smartctl.py health` plugin call (ms). */
const XOSTOR_SMART_TIMEOUT_MS = 10_000

/** Timeout for a single `updater.py check_update` plugin call (ms). */
const XOSTOR_UPDATES_TIMEOUT_MS = 30_000

/**
 * Dependencies threaded into the cache-backed XOSTOR collector wrappers.
 *
 * `xo` is the XO app handle; the three caches are the parent plugin's
 * `TtlCache` instances (lifetime/coalescing live on the plugin, the collection
 * logic lives here).
 */
export interface XostorCollectorDeps {
  xo: XoApp
  healthCheckCache: TtlCache<XostorPayload>
  smartCache: TtlCache<XostorSmartPayload>
  updatesCache: TtlCache<XostorUpdatesPayload>
}

/**
 * Collect XOSTOR cluster health data for every LINSTOR-backed SR.
 *
 * The healthCheck XAPI plugin call goes to the pool master and is
 * relatively expensive; `TtlCache` caches the result for
 * `XOSTOR_CACHE_TTL_MS` and coalesces concurrent scrapes.
 *
 * Per-SR failures are isolated: a failure on one cluster yields an
 * `up: false` entry, leaving the other clusters' data intact.
 */
export function getXostorData(deps: XostorCollectorDeps): Promise<XostorPayload> {
  return deps.healthCheckCache.get(() => collectXostorData(deps.xo))
}

export async function collectXostorData(xo: XoApp): Promise<XostorPayload> {
  const allSrs = xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const allHosts = xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
  const allPbds = xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>

  const clusters: XostorClusterItem[] = []
  for (const sr of Object.values(allSrs)) {
    if (sr.SR_type !== 'linstor') {
      continue
    }

    const pool = allPools[sr.$poolId]
    const master = pool !== undefined ? allHosts[pool.master] : undefined
    const poolName = pool?.name_label ?? ''

    const groupName = findLinstorGroupName(sr, allPbds)

    if (master === undefined || groupName === undefined) {
      logger.warn('Skipping XOSTOR healthCheck (missing master or group-name)', {
        srUuid: sr.uuid,
        poolId: sr.$poolId,
      })
      clusters.push({
        sr_uuid: sr.uuid,
        pool_id: sr.$poolId,
        pool_name: poolName,
        up: false,
        nodes: [],
        resourceCount: 0,
        replicaStates: {},
      })
      continue
    }

    try {
      const xapi = xo.getXapi(sr)
      const rawResponse = await withTimeout(
        xapi.callAsync<string>('host.call_plugin', master._xapiRef, 'linstor-manager', 'healthCheck', { groupName }),
        XOSTOR_HEALTHCHECK_TIMEOUT_MS,
        'linstor-manager healthCheck timed out'
      )

      const parsed = parseXostorHealthCheck(rawResponse, sr.uuid)
      const nodes: XostorNodeItem[] = []
      for (const [hostname, rawState] of Object.entries(parsed.nodes ?? {})) {
        nodes.push({
          node_name: hostname,
          role: hostname === master.hostname ? 'master' : 'satellite',
          state: typeof rawState === 'string' ? rawState : JSON.stringify(rawState),
        })
      }

      clusters.push({
        sr_uuid: sr.uuid,
        pool_id: sr.$poolId,
        pool_name: poolName,
        up: true,
        nodes,
        resourceCount: Object.keys(parsed.resources ?? {}).length,
        replicaStates: countReplicaStates(parsed.resources ?? {}),
      })
    } catch (error) {
      logger.warn('XOSTOR healthCheck failed', { srUuid: sr.uuid, poolId: sr.$poolId, error })
      clusters.push({
        sr_uuid: sr.uuid,
        pool_id: sr.$poolId,
        pool_name: poolName,
        up: false,
        nodes: [],
        resourceCount: 0,
        replicaStates: {},
      })
    }
  }

  logger.debug('Returning XOSTOR data', { clusterCount: clusters.length })
  return { clusters }
}

/**
 * Aggregate XAPI alarm messages per XOSTOR cluster.
 *
 * Walks `xo.getObjects()` in-memory — no plugin call, no network IO, no
 * cache (the call is sub-millisecond). For each LINSTOR-backed SR, counts
 * the messages whose `name` is in `XAPI_ALARM_NAMES` and whose `$object`
 * targets the SR (`target_type='sr'`) or one of the hosts backing it via
 * a PBD (`target_type='host'`).
 *
 * A host shared between multiple XOSTOR SRs sees its alarms counted in
 * each cluster it backs — by design, since an underlying host issue
 * degrades every SR on that host.
 */
export function getXostorAlarms(xo: XoApp): XostorAlarmsPayload {
  const allSrs = xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
  const xostorSrs = Object.values(allSrs).filter(sr => sr.SR_type === 'linstor')

  // Skip the (potentially expensive) message-store scan on non-XOSTOR
  // deployments. The message store on a busy XAPI can be in the thousands.
  if (xostorSrs.length === 0) {
    return { clusters: [] }
  }

  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const allPbds = xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>
  const allMessages = xo.getObjects({ filter: { type: 'message' } }) as Record<string, XoMessage>

  const alarmMessages: XoMessage[] = []
  for (const msg of Object.values(allMessages)) {
    if (XAPI_ALARM_NAMES.has(msg.name)) {
      alarmMessages.push(msg)
    }
  }

  const clusters: XostorAlarmsItem[] = []
  for (const sr of xostorSrs) {
    const hostIds = xostorHostIdsFromPbds(sr, allPbds)

    const buckets = new Map<string, XostorAlarmEntry>()
    for (const msg of alarmMessages) {
      const target = msg.$object
      let targetType: 'sr' | 'host' | undefined
      if (target === sr.id) {
        targetType = 'sr'
      } else if (hostIds.has(target)) {
        targetType = 'host'
      } else {
        continue
      }

      const key = `${msg.name}|${targetType}`
      const existing = buckets.get(key)
      if (existing !== undefined) {
        existing.count += 1
      } else {
        buckets.set(key, { alarm_name: msg.name, target_type: targetType, count: 1 })
      }
    }

    clusters.push({
      sr_uuid: sr.uuid,
      pool_id: sr.$poolId,
      pool_name: allPools[sr.$poolId]?.name_label ?? '',
      up: true,
      entries: [...buckets.values()],
    })
  }

  logger.debug('Returning XOSTOR alarms', { clusterCount: clusters.length })
  return { clusters }
}

/**
 * Collect SMART overall-health for every host backing a XOSTOR PBD.
 *
 * Cached with `XOSTOR_SMART_CACHE_TTL_MS`. Each (sr, host) pair becomes its
 * own `XostorSmartHost`. Per-host failures are isolated and surfaced via
 * `up: false`; missing `smartctl.py` on a host is the same path.
 */
export function getXostorSmartHealth(deps: XostorCollectorDeps): Promise<XostorSmartPayload> {
  return deps.smartCache.get(() => collectXostorSmartHealth(deps.xo))
}

export async function collectXostorSmartHealth(xo: XoApp): Promise<XostorSmartPayload> {
  const allSrs = xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const allHosts = xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
  const allPbds = xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>

  const tasks: Array<Promise<XostorSmartHost>> = []
  for (const sr of Object.values(allSrs)) {
    if (sr.SR_type !== 'linstor') continue

    const poolName = allPools[sr.$poolId]?.name_label ?? ''

    for (const hostId of xostorHostIdsFromPbds(sr, allPbds)) {
      const host = allHosts[hostId]
      if (host === undefined) continue

      tasks.push(fetchHostSmart(xo, sr, poolName, host))
    }
  }

  const hosts = await Promise.all(tasks)
  logger.debug('Returning XOSTOR SMART data', { hostCount: hosts.length })
  return { hosts }
}

export async function fetchHostSmart(xo: XoApp, sr: XoSr, poolName: string, host: XoHost): Promise<XostorSmartHost> {
  const base = {
    sr_uuid: sr.uuid,
    pool_id: sr.$poolId,
    pool_name: poolName,
    host_uuid: host.uuid,
    host_name: host.name_label,
  }

  try {
    const xapi = xo.getXapi(sr)
    const rawResponse = await withTimeout(
      xapi.callAsync<string>('host.call_plugin', host._xapiRef, 'smartctl.py', 'health', {}),
      XOSTOR_SMART_TIMEOUT_MS,
      'smartctl.py health timed out'
    )
    const devices = parseXostorSmartHealth(rawResponse, host.uuid)
    return { ...base, up: true, devices }
  } catch (error) {
    logger.warn('smartctl.py health failed', { srUuid: sr.uuid, hostUuid: host.uuid, error })
    return { ...base, up: false, devices: [] }
  }
}

/**
 * Collect pending XOSTOR-related package updates for every host backing a
 * XOSTOR PBD.
 *
 * Cached with `XOSTOR_UPDATES_CACHE_TTL_MS` (1 h). `updater.py check_update`
 * is yum-metadata-heavy and unsuitable for per-scrape invocation.
 */
export function getXostorUpdates(deps: XostorCollectorDeps): Promise<XostorUpdatesPayload> {
  return deps.updatesCache.get(() => collectXostorUpdates(deps.xo))
}

export async function collectXostorUpdates(xo: XoApp): Promise<XostorUpdatesPayload> {
  const allSrs = xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const allHosts = xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
  const allPbds = xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>

  const tasks: Array<Promise<XostorUpdateItem>> = []
  for (const sr of Object.values(allSrs)) {
    if (sr.SR_type !== 'linstor') continue

    const poolName = allPools[sr.$poolId]?.name_label ?? ''

    for (const hostId of xostorHostIdsFromPbds(sr, allPbds)) {
      const host = allHosts[hostId]
      if (host === undefined) continue

      tasks.push(fetchHostUpdates(xo, sr, poolName, host))
    }
  }

  const hosts = await Promise.all(tasks)
  logger.debug('Returning XOSTOR pending updates', { hostCount: hosts.length })
  return { hosts }
}

export async function fetchHostUpdates(xo: XoApp, sr: XoSr, poolName: string, host: XoHost): Promise<XostorUpdateItem> {
  const base = {
    sr_uuid: sr.uuid,
    pool_id: sr.$poolId,
    pool_name: poolName,
    host_uuid: host.uuid,
    host_name: host.name_label,
  }

  try {
    const xapi = xo.getXapi(sr)
    const rawResponse = await withTimeout(
      xapi.callAsync<string>('host.call_plugin', host._xapiRef, 'updater.py', 'check_update', {}),
      XOSTOR_UPDATES_TIMEOUT_MS,
      'updater.py check_update timed out'
    )
    const packages = parseXostorCheckUpdate(rawResponse, host.uuid)
    return { ...base, up: true, packages }
  } catch (error) {
    logger.warn('updater.py check_update failed', { srUuid: sr.uuid, hostUuid: host.uuid, error })
    return { ...base, up: false, packages: [] }
  }
}
