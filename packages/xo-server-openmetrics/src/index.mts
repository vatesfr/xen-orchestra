/**
 * XO Server OpenMetrics Plugin
 *
 * This plugin exposes XO metrics in OpenMetrics/Prometheus format.
 * It spawns a child process that runs an HTTP server and fetches
 * RRD data directly from connected XAPI pools.
 */

import type {
  XoApp,
  XoHost,
  XoMessage,
  XoNetwork,
  XoPbd,
  XoPif,
  XoPool,
  XoSr,
  XoVbd,
  XoVdi,
  XoVif,
  XoVm,
  XoVmController,
} from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { fork, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRandomValues } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import v8 from 'node:v8'

// ============================================================================
// Types
// ============================================================================

interface IpcMessage {
  type: string
  payload?: unknown
  requestId?: string
  error?: string
}

interface PluginConfiguration {
  secret: string
}

interface ServerConfiguration {
  port: number
  bindAddress: string
  secret: string
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
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
export interface VmLabelInfo {
  name_label: string
  is_control_domain: boolean
  vbdDeviceToVdiName: Record<string, string> // { "xvda": "System Disk" }
  vbdDeviceToVdiUuid: Record<string, XoVdi['uuid']> // { "xvda": "vdi-uuid-123" }
  vifIndexToNetworkName: Record<string, string> // { "0": "Pool-wide network" }
  startTime: number | null // Unix timestamp of VM boot (from vm.startTime)
  power_state: string // VM power state (Running, Paused, Halted, Suspended)
  pool_id: string
  pool_name: string
}

export interface HostLabelInfo {
  name_label: string
  pifDeviceToNetworkName: Record<string, string> // { "eth0": "Management" }
  startTime: number | null // Unix timestamp of host boot (from host.startTime)
}

export interface SrLabelInfo {
  name_label: string
  /**
   * Mirrors `XoSr.SR_type` (kept in CamelCase to match the XAPI source field).
   * Resolved into the `sr_type` snake_case OpenMetrics label by `transformMetric`.
   */
  SR_type: string
}

export interface LabelLookupData {
  vms: Record<XoVm['uuid'] | XoVmController['uuid'], VmLabelInfo>
  hosts: Record<XoHost['uuid'], HostLabelInfo>
  srs: Record<XoSr['uuid'], SrLabelInfo>
  srTruncatedToUuid: Record<string, XoSr['uuid']> // maps any UUID truncation (prefix or suffix) to the full SR UUID
  vdiUuidToSrUuid: Record<XoVdi['uuid'], XoSr['uuid']> // maps VDI UUID to parent SR UUID
}

interface XapiCredentialsPayload {
  hosts: HostCredentials[]
  labels: LabelLookupData
}

export type SrDataItem = Pick<XoSr, 'uuid' | 'name_label' | 'size' | 'physical_usage' | 'usage'> & {
  pool_id: string
  pool_name: string
  /**
   * Verbatim `XoSr.SR_type` (e.g. `'linstor'`, `'lvm'`, `'nfs'`). Emitted as
   * the `sr_type` OpenMetrics label so Grafana queries can filter / split
   * by storage technology.
   */
  sr_type: string
  host_id?: string
  host_name?: string
}

export interface XoMetricsData {
  pendingTaskCount: number
  poolCount: number
  hostCount: number
  vmCount: number
  srCountByContentType: Record<string, number>
  userCount: number
  groupCount: number
  socketCount: number
  hostCountByVersion: Array<{ productBrand: string; version: string; count: number }>
  hostCountByLicense: Array<{ skuType: string; count: number }>
  backupJobStats: Array<{
    type: string
    jobCount: number
  }>
  nodeProcess: {
    eluMean: number
    eluP99: number
    eluMax: number
    memoryRssBytes: number
    memoryHeapUsedBytes: number
    memoryHeapTotalBytes: number
    memoryExternalBytes: number
    memoryArrayBuffersBytes: number
    heapSizeLimitBytes: number
    heapAvailableBytes: number
    detachedContexts: number
    cpuUserSeconds: number
    cpuSystemSeconds: number
  }
}

interface SrDataPayload {
  srs: SrDataItem[]
}

export type VdiDataItem = {
  uuid: string
  name_label: string
  size: number
  usage: number
  sr_uuid: string
  sr_name: string
  /** SR_type of the parent SR, mirrored as the `sr_type` label. */
  sr_type: string
  pool_id: string
  pool_name: string
  vm_uuid?: string
  vm_name?: string
}

interface VdiDataPayload {
  vdis: VdiDataItem[]
}

export type HostStatusItem = Pick<XoHost, 'uuid' | 'name_label' | 'power_state' | 'enabled'> & {
  pool_id: string
  pool_name: string
}

interface HostStatusPayload {
  hosts: HostStatusItem[]
}

export type VmStatusItem = Pick<XoVm, 'uuid' | 'name_label' | 'power_state'> & {
  pool_id: string
  pool_name: string
}

interface VmStatusPayload {
  vms: VmStatusItem[]
}

/**
 * XOSTOR cluster node entry.
 *
 * Represents a single LINSTOR node in a XOSTOR cluster, identified by
 * its hostname. The role label distinguishes the pool master from satellites.
 * The state label carries the raw status returned by linstor-manager.healthCheck.
 */
export interface XostorNodeItem {
  node_name: string
  role: 'master' | 'satellite'
  state: string
}

/**
 * XOSTOR cluster summary for a single LINSTOR-backed SR.
 *
 * `up` indicates whether the healthCheck call succeeded. When false, `nodes`
 * is empty, `resourceCount` is 0, and `replicaStates` is `{}`; consumers
 * should treat the cluster as unreachable rather than empty.
 *
 * `replicaStates` maps each `disk-state` value reported by `linstor-manager`
 * (e.g., `UpToDate`, `Inconsistent`, `Outdated`, `Diskless`, `Unknown`) to the
 * number of replicas across all resources in that state. The sum equals
 * `# resources × replica_factor`.
 */
export interface XostorClusterItem {
  sr_uuid: string
  pool_id: string
  pool_name: string
  up: boolean
  nodes: XostorNodeItem[]
  resourceCount: number
  replicaStates: Record<string, number>
}

export interface XostorPayload {
  clusters: XostorClusterItem[]
}

/**
 * One aggregated alarm bucket for a XOSTOR cluster.
 *
 * Counts the number of XAPI messages whose `name` matches `alarm_name` and
 * whose `$object` is either the XOSTOR SR itself (`target_type='sr'`) or one
 * of the hosts backing it via a PBD (`target_type='host'`).
 */
export interface XostorAlarmEntry {
  alarm_name: string
  target_type: 'sr' | 'host'
  count: number
}

export interface XostorAlarmsItem {
  sr_uuid: string
  pool_id: string
  pool_name: string
  up: boolean
  entries: XostorAlarmEntry[]
}

export interface XostorAlarmsPayload {
  clusters: XostorAlarmsItem[]
}

/**
 * One disk reported by `smartctl.py health` on a XOSTOR host.
 *
 * `status` is the raw overall-health string returned by the plugin
 * (e.g. `"PASSED"`, `"FAILED"`, `"UNKNOWN"`). Verbatim — dashboards
 * normalize via regex if they need to.
 */
export interface XostorSmartDevice {
  device: string
  status: string
}

/**
 * SMART-health snapshot of a single XOSTOR host.
 *
 * `up` indicates whether the plugin call succeeded. When false, `devices`
 * is empty and the host is considered unreachable for SMART data — most
 * commonly because `smartctl.py` is not installed on the host.
 */
export interface XostorSmartHost {
  sr_uuid: string
  pool_id: string
  pool_name: string
  host_uuid: string
  host_name: string
  up: boolean
  devices: XostorSmartDevice[]
}

export interface XostorSmartPayload {
  hosts: XostorSmartHost[]
}

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
 * One pending XOSTOR-related package update on a host.
 *
 * Severity is intentionally absent: XCP-ng's `updater.py check_update`
 * payload does not carry advisory severity. Adding it as a constant
 * `'Unknown'` would be misleading.
 */
export interface XostorUpdatePackage {
  package: string
}

export interface XostorUpdateItem {
  sr_uuid: string
  pool_id: string
  pool_name: string
  host_uuid: string
  host_name: string
  up: boolean
  packages: XostorUpdatePackage[]
}

export interface XostorUpdatesPayload {
  hosts: XostorUpdateItem[]
}

// Union type for all XO objects we handle
type XoObject = XoHost | XoPool | XoVm | XoVmController | XoVbd | XoVdi | XoVif | XoPif | XoSr | XoNetwork

/**
 * Names of XAPI message types treated as "alarms" by XO's web UI.
 *
 * Mirrors `isAlarm` in `packages/xo-server/src/utils.mjs`. Kept as a local
 * constant because `xo-server-openmetrics` is a separate package without a
 * runtime dependency on `xo-server`. Update both files in lock-step if XO
 * grows the alarm-name set.
 */
const XAPI_ALARM_NAMES = new Set<string>(['ALARM', 'BOND_STATUS_CHANGED', 'MULTIPATH_PERIODIC_ALERT'])

/**
 * Subset of `linstor-manager.healthCheck` response we consume.
 *
 * The plugin returns a JSON-encoded string. The shape is not versioned and
 * can grow (the frontend tolerates `resources` being absent on older plugins).
 * We only depend on the two top-level maps and treat everything else as
 * untyped.
 */
interface XostorHealthCheckRaw {
  nodes?: Record<string, unknown>
  resources?: Record<string, unknown>
}

/**
 * Time-based cache with in-flight call coalescing.
 *
 * `get()` returns the cached value while fresh; on miss it invokes the
 * supplied loader once and shares the same in-flight promise with any
 * concurrent caller until the loader settles. Keeps the parent process from
 * issuing redundant XAPI plugin calls when several Prometheus scrapes
 * overlap a cache miss.
 */
class TtlCache<T> {
  #ttlMs: number
  #snapshot: { value: T; expiresAt: number } | undefined
  #inFlight: Promise<T> | undefined

  constructor(ttlMs: number) {
    this.#ttlMs = ttlMs
  }

  async get(load: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const snap = this.#snapshot
    if (snap !== undefined && snap.expiresAt > now) {
      return snap.value
    }
    if (this.#inFlight !== undefined) {
      return this.#inFlight
    }
    const pending = load()
      .then(value => {
        this.#snapshot = { value, expiresAt: Date.now() + this.#ttlMs }
        return value
      })
      .finally(() => {
        this.#inFlight = undefined
      })
    this.#inFlight = pending
    return pending
  }
}

// ============================================================================
// Constants
// ============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const logger = createLogger('xo:xo-server-openmetrics')

/** Default port for the OpenMetrics HTTP server */
const DEFAULT_PORT = 9004

/** Default bind address for the OpenMetrics HTTP server */
const DEFAULT_BIND_ADDRESS = 'localhost'

/** Default timeout for IPC operations in milliseconds */
const IPC_TIMEOUT_MS = 10_000

/** Default timeout for graceful shutdown in milliseconds */
const SHUTDOWN_TIMEOUT_MS = 5_000

/**
 * Cache lifetime for XOSTOR healthCheck payload (ms).
 *
 * Prometheus scrapes typically run every 15s; the LINSTOR controller is much
 * slower to interrogate. Caching the healthCheck output for 60s keeps the
 * controller idle between scrapes without making the dashboard noticeably
 * stale.
 */
const XOSTOR_CACHE_TTL_MS = 60_000

/** Timeout for a single XOSTOR healthCheck plugin call (ms). */
const XOSTOR_HEALTHCHECK_TIMEOUT_MS = 8_000

/**
 * Cache lifetime for the per-host SMART payload (ms).
 *
 * SMART overall-status changes on a multi-hour scale; 5 minutes keeps
 * hosts idle between scrapes without making dashboards stale.
 */
const XOSTOR_SMART_CACHE_TTL_MS = 300_000

/** Timeout for a single `smartctl.py health` plugin call (ms). */
const XOSTOR_SMART_TIMEOUT_MS = 10_000

/**
 * Cache lifetime for the per-host pending-update payload (ms).
 *
 * `updater.py check_update` triggers a yum metadata refresh, which is slow
 * and hits the upstream repos. Pending updates change on a multi-hour
 * timescale, so a 1 hour cache keeps hosts idle without sacrificing
 * dashboard freshness in any operationally meaningful way.
 */
const XOSTOR_UPDATES_CACHE_TTL_MS = 3_600_000

/** Timeout for a single `updater.py check_update` plugin call (ms). */
const XOSTOR_UPDATES_TIMEOUT_MS = 30_000

// ============================================================================
// Configuration Schema (exported for xo-server)
// ============================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    secret: {
      type: 'string',
      title: 'Prometheus secret',
      description: 'Add this secret to http_config > authorization > credentials, and set type to Bearer',
      default: Buffer.from(getRandomValues(new Uint32Array(8))).toString('hex'),
    },
  },
  additionalProperties: false,
}

// ============================================================================
// XOSTOR helpers (module scope)
// ============================================================================

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      err => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

/** UUID truncation lengths used by XAPI RRD legends. */
export const SR_UUID_TRUNCATIONS: ReadonlyArray<number> = [8, 12, 16, 20]

/**
 * Insert every (prefix, suffix) truncation of `uuid` into `index`, mapping
 * each truncation to the full UUID. XCP-ng RRD legends encode the SR as the
 * first 8 chars of the UUID, but older / variant builds may use the suffix;
 * indexing both keeps the SR-name and `sr_type` resolution stable across
 * versions. First match wins, so existing entries are never overwritten.
 *
 * Exported for testability.
 */
export function indexSrUuidTruncations(uuid: string, index: Record<string, string>): void {
  for (const truncLen of SR_UUID_TRUNCATIONS) {
    if (uuid.length < truncLen) continue
    const prefix = uuid.slice(0, truncLen)
    const suffix = uuid.slice(-truncLen)
    if (index[prefix] === undefined) {
      index[prefix] = uuid
    }
    if (index[suffix] === undefined) {
      index[suffix] = uuid
    }
  }
}

/**
 * Set of host IDs that back a XOSTOR SR via its PBDs.
 *
 * Each PBD links one host to one SR; the set deduplicates in case the same
 * host shows up via multiple PBDs (rare but possible).
 */
function xostorHostIdsFromPbds(sr: XoSr, allPbds: Record<string, XoPbd>): Set<string> {
  const hostIds = new Set<string>()
  for (const pbdId of sr.$PBDs) {
    const pbd = allPbds[pbdId]
    if (pbd !== undefined) {
      hostIds.add(pbd.host)
    }
  }
  return hostIds
}

function findLinstorGroupName(sr: XoSr, allPbds: Record<string, XoPbd>): string | undefined {
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
function countReplicaStates(resources: Record<string, unknown>): Record<string, number> {
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
function parseXostorSmartHealth(raw: unknown, hostUuid: string): XostorSmartDevice[] {
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
function parseXostorCheckUpdate(raw: unknown, hostUuid: string): XostorUpdatePackage[] {
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

function parseXostorHealthCheck(raw: unknown, srUuid: string): XostorHealthCheckRaw {
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

// ============================================================================
// Plugin Class
// ============================================================================

class OpenMetricsPlugin {
  #configuration: PluginConfiguration | undefined
  #childProcess: ChildProcess | undefined
  #pendingRequests = new Map<string, PendingRequest>()
  #requestIdCounter = 0
  readonly #xo: XoApp

  // ELU sampling state
  #eluSamples: number[] = []
  #lastEluSnapshot = performance.eventLoopUtilization()
  #lastCpuUsage = process.cpuUsage()
  #eluSamplerInterval: ReturnType<typeof setInterval> | undefined

  #xostorHealthCheckCache = new TtlCache<XostorPayload>(XOSTOR_CACHE_TTL_MS)
  #xostorSmartCache = new TtlCache<XostorSmartPayload>(XOSTOR_SMART_CACHE_TTL_MS)
  #xostorUpdatesCache = new TtlCache<XostorUpdatesPayload>(XOSTOR_UPDATES_CACHE_TTL_MS)

  constructor(xo: XoApp) {
    this.#xo = xo
    logger.info('Plugin initialized')
  }

  #startEluSampler(): void {
    const MAX_SAMPLE = 60
    this.#lastEluSnapshot = performance.eventLoopUtilization()
    this.#lastCpuUsage = process.cpuUsage()
    this.#eluSamples = []
    this.#eluSamplerInterval = setInterval(() => {
      const curr = performance.eventLoopUtilization()
      const delta = performance.eventLoopUtilization(curr, this.#lastEluSnapshot)
      this.#lastEluSnapshot = curr
      this.#eluSamples.push(delta.utilization)
      // ensure the sample size is bound
      while (this.#eluSamples.length > MAX_SAMPLE) {
        this.#eluSamples.shift()
      }
    }, 1000)
    this.#eluSamplerInterval.unref()
  }

  #stopEluSampler(): void {
    if (this.#eluSamplerInterval !== undefined) {
      clearInterval(this.#eluSamplerInterval)
      this.#eluSamplerInterval = undefined
    }
  }

  /**
   * Configure the plugin with the provided configuration.
   */
  async configure(configuration: PluginConfiguration): Promise<void> {
    this.#configuration = configuration
    logger.debug('Plugin configured')
  }

  /**
   * Load and start the plugin.
   * Forks the child process and waits for it to be ready.
   */
  async load(): Promise<void> {
    await this.#xo.checkFeatureAuthorization('PLUGIN.OPENMETRICS')
    if (this.#childProcess !== undefined) {
      logger.warn('Plugin already loaded, skipping')
      return
    }

    // Port and bindAddress are fixed for security (server is behind xo-server proxy)
    const serverConfig: ServerConfiguration = {
      port: DEFAULT_PORT,
      bindAddress: DEFAULT_BIND_ADDRESS,
      secret: this.#configuration?.secret ?? '',
    }

    logger.info('Starting OpenMetrics server', {
      port: serverConfig.port,
      bindAddress: serverConfig.bindAddress,
    })

    this.#startEluSampler()
    await this.#startChildProcess(serverConfig)
  }

  /**
   * Unload and stop the plugin.
   * Gracefully shuts down the child process.
   */
  async unload(): Promise<void> {
    this.#stopEluSampler()

    if (this.#childProcess === undefined) {
      return
    }

    logger.info('Stopping OpenMetrics server')

    await this.#stopChildProcess()
  }

  /**
   * Start the child process and wait for it to be ready.
   */
  async #startChildProcess(configuration: ServerConfiguration): Promise<void> {
    const serverPath = join(__dirname, 'open-metric-server.mjs')

    this.#childProcess = fork(serverPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    const child = this.#childProcess

    child.on('message', (message: unknown) => this.#handleChildMessage(message))

    child.on('error', (error: Error) => {
      logger.error('Child process error', { error })
    })

    child.on('exit', (code: number | null, signal: string | null) => {
      logger.info('Child process exited', { code, signal })
      this.#childProcess = undefined
      this.#rejectAllPendingRequests(new Error(`Child process exited with code ${code}`))
    })

    if (child.stdout !== null) {
      child.stdout.on('data', (data: Buffer) => {
        logger.debug('Child stdout', { data: data.toString() })
      })
    }

    if (child.stderr !== null) {
      child.stderr.on('data', (data: Buffer) => {
        logger.warn('Child stderr', { data: data.toString() })
      })
    }

    this.#sendToChild({ type: 'INIT', payload: configuration })

    await this.#waitForReady()
  }

  /**
   * Stop the child process gracefully.
   */
  async #stopChildProcess(): Promise<void> {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    try {
      this.#sendToChildNoWait({ type: 'SHUTDOWN' })

      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          logger.warn('Child process did not exit gracefully, forcing kill')
          child.kill('SIGKILL')
          resolve()
        }, SHUTDOWN_TIMEOUT_MS)

        child.once('exit', () => {
          clearTimeout(timeout)
          resolve()
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
   */
  #handleChildMessage(rawMessage: unknown): void {
    const message = rawMessage as IpcMessage

    logger.debug('Received message from child', { type: message.type })

    switch (message.type) {
      case 'READY':
        this.#resolvePendingRequest('READY', undefined)
        break

      case 'ERROR':
        // ERROR is only sent during initialization when the child process fails to start
        // (e.g., unable to bind to port). At this point, load() is waiting for READY,
        // so we reject that pending request to propagate the failure.
        logger.error('Child process error', { error: message.error })
        this.#rejectPendingRequest('READY', new Error(String(message.error)))
        break

      case 'GET_XAPI_CREDENTIALS': {
        const credentials = this.#getXapiCredentials()
        this.#sendToChildNoWait({
          type: 'XAPI_CREDENTIALS',
          requestId: message.requestId,
          payload: credentials,
        })
        break
      }

      case 'GET_SR_DATA': {
        const srData = this.#getSrData()
        this.#sendToChildNoWait({
          type: 'SR_DATA',
          requestId: message.requestId,
          payload: srData,
        })
        break
      }

      case 'GET_VDI_DATA': {
        const vdiData = this.#getVdiData()
        this.#sendToChildNoWait({
          type: 'VDI_DATA',
          requestId: message.requestId,
          payload: vdiData,
        })
        break
      }

      case 'GET_HOST_STATUS': {
        const hostStatus = this.#getHostStatusData()
        this.#sendToChildNoWait({
          type: 'HOST_STATUS',
          requestId: message.requestId,
          payload: hostStatus,
        })
        break
      }

      case 'GET_VM_STATUS': {
        const vmStatus = this.#getVmStatusData()
        this.#sendToChildNoWait({
          type: 'VM_STATUS',
          requestId: message.requestId,
          payload: vmStatus,
        })
        break
      }

      case 'GET_XOSTOR_DATA': {
        this.#getXostorData()
          .then((xostorPayload: XostorPayload) => {
            this.#sendToChildNoWait({
              type: 'XOSTOR_DATA',
              requestId: message.requestId,
              payload: xostorPayload,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XOSTOR data', { error: err })
            this.#sendToChildNoWait({
              type: 'XOSTOR_DATA',
              requestId: message.requestId,
              payload: { clusters: [] },
            })
          })
        break
      }

      case 'GET_XOSTOR_ALARMS': {
        try {
          const alarmsPayload = this.#getXostorAlarms()
          this.#sendToChildNoWait({
            type: 'XOSTOR_ALARMS',
            requestId: message.requestId,
            payload: alarmsPayload,
          })
        } catch (err) {
          logger.error('Failed to collect XOSTOR alarms', { error: err })
          this.#sendToChildNoWait({
            type: 'XOSTOR_ALARMS',
            requestId: message.requestId,
            payload: { clusters: [] },
          })
        }
        break
      }

      case 'GET_XOSTOR_SMART': {
        this.#getXostorSmartHealth()
          .then((smartPayload: XostorSmartPayload) => {
            this.#sendToChildNoWait({
              type: 'XOSTOR_SMART',
              requestId: message.requestId,
              payload: smartPayload,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XOSTOR SMART data', { error: err })
            this.#sendToChildNoWait({
              type: 'XOSTOR_SMART',
              requestId: message.requestId,
              payload: { hosts: [] },
            })
          })
        break
      }

      case 'GET_XOSTOR_UPDATES': {
        this.#getXostorUpdates()
          .then((updatesPayload: XostorUpdatesPayload) => {
            this.#sendToChildNoWait({
              type: 'XOSTOR_UPDATES',
              requestId: message.requestId,
              payload: updatesPayload,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XOSTOR pending updates', { error: err })
            this.#sendToChildNoWait({
              type: 'XOSTOR_UPDATES',
              requestId: message.requestId,
              payload: { hosts: [] },
            })
          })
        break
      }

      case 'GET_XO_METRICS': {
        this.#getXoMetrics()
          .then((xoMetrics: XoMetricsData) => {
            this.#sendToChildNoWait({
              type: 'XO_METRICS',
              requestId: message.requestId,
              payload: xoMetrics,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XO metrics', { error: err })
            const emptyMetrics: XoMetricsData = {
              pendingTaskCount: 0,
              poolCount: 0,
              hostCount: 0,
              vmCount: 0,
              srCountByContentType: {},
              userCount: 0,
              groupCount: 0,
              socketCount: 0,
              hostCountByVersion: [],
              hostCountByLicense: [],
              backupJobStats: [],
              nodeProcess: {
                eluMean: 0,
                eluP99: 0,
                eluMax: 0,
                memoryRssBytes: 0,
                memoryHeapUsedBytes: 0,
                memoryHeapTotalBytes: 0,
                memoryExternalBytes: 0,
                memoryArrayBuffersBytes: 0,
                heapSizeLimitBytes: 0,
                heapAvailableBytes: 0,
                detachedContexts: 0,
                cpuUserSeconds: 0,
                cpuSystemSeconds: 0,
              },
            }
            this.#sendToChildNoWait({
              type: 'XO_METRICS',
              requestId: message.requestId,
              payload: emptyMetrics,
            })
          })
        break
      }

      default:
        logger.warn('Unknown message type from child', { type: message.type })
    }
  }

  /**
   * Get XAPI credentials for all hosts in all connected pools.
   * Returns host addresses, labels, pool info, and session IDs for the child process to fetch RRD data directly.
   */
  #getXapiCredentials(): XapiCredentialsPayload {
    const hosts: HostCredentials[] = []

    // Build a map of poolId -> { sessionId, protocol }
    const poolSessionMap = new Map<string, { sessionId: string; protocol: string }>()
    const xapis = this.#xo.getAllXapis()

    for (const serverId of Object.keys(xapis)) {
      const xapi = xapis[serverId]
      if (xapi === undefined || xapi.status !== 'connected') {
        continue
      }

      const pool = xapi.pool
      if (pool === undefined) {
        logger.warn('Pool is undefined for connected xapi', { serverId })
        continue
      }

      const url = xapi._url
      if (url === undefined) {
        logger.warn('URL is undefined for connected xapi', { serverId, poolUuid: pool.uuid })
        continue
      }

      poolSessionMap.set(pool.uuid, {
        sessionId: xapi.sessionId,
        protocol: url.protocol,
      })
    }

    // Get all pools to resolve pool labels
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    // Get all hosts from XO objects
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>

    for (const host of Object.values(allHosts)) {
      // Get the session info for this host's pool
      const poolInfo = poolSessionMap.get(host.$poolId)
      if (poolInfo === undefined) {
        logger.debug('No session for host pool, pool may be disconnected', {
          hostId: host.uuid,
          poolId: host.$poolId,
        })
        continue
      }

      hosts.push({
        hostId: host.uuid,
        hostAddress: host.address,
        hostLabel: host.name_label,
        poolId: host.$poolId,
        poolLabel: poolLabelMap.get(host.$poolId) ?? host.$poolId,
        sessionId: poolInfo.sessionId,
        protocol: poolInfo.protocol,
      })
    }

    logger.debug('Returning host credentials', { hostCount: hosts.length })
    return { hosts, labels: this.#getLabelLookupData() }
  }

  /**
   * Get SR data for capacity metrics.
   * Returns size, physical_usage, and virtual_allocation (usage) for all SRs.
   */
  #getSrData(): SrDataPayload {
    const srs: SrDataItem[] = []

    // Get all pools to resolve pool labels
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    // Get all hosts to resolve host labels for local SRs
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
    const hostLabelMap = new Map<string, string>()
    for (const host of Object.values(allHosts)) {
      hostLabelMap.set(host.id, host.name_label)
    }

    // Get all SRs
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>

    for (const sr of Object.values(allSrs)) {
      const srData: SrDataItem = {
        uuid: sr.uuid,
        name_label: sr.name_label,
        pool_id: sr.$poolId,
        pool_name: poolLabelMap.get(sr.$poolId) ?? '',
        sr_type: sr.SR_type ?? '',
        size: sr.size,
        physical_usage: sr.physical_usage,
        usage: sr.usage,
      }

      // For local (non-shared) SRs, add host information
      // $container is the host ID for local SRs, pool ID for shared SRs
      if (!sr.shared && sr.$container !== sr.$poolId) {
        const hostId = sr.$container as string
        srData.host_id = hostId
        srData.host_name = hostLabelMap.get(hostId)
      }

      srs.push(srData)
    }

    logger.debug('Returning SR data', { srCount: srs.length })
    return { srs }
  }

  /**
   * Get VDI data for disk size metrics.
   * Returns virtual size and physical usage for all VDIs (excluding snapshots and unmanaged).
   */
  #getVdiData(): VdiDataPayload {
    const vdis: VdiDataItem[] = []

    // Get only the object types we need: SRs, VBDs, pools, VMs, VDIs
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
    const allVbds = this.#xo.getObjects({ filter: { type: 'VBD' } }) as Record<string, XoVbd>

    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    // Build VM lookup for resolving attached VMs via VBDs
    const allVms = this.#xo.getObjects({ filter: { type: 'VM' } }) as Record<string, XoVm>

    // Map VM id -> VM object for quick lookup
    const vmById = new Map<string, XoVm>()
    for (const vm of Object.values(allVms)) {
      vmById.set(vm.id, vm)
    }

    // Get all VDIs (excluding snapshots and unmanaged)
    const allVdis = this.#xo.getObjects({ filter: { type: 'VDI' } }) as Record<string, XoVdi>

    for (const vdi of Object.values(allVdis)) {
      // Resolve SR
      const sr = allSrs[vdi.$SR]
      if (sr === undefined) {
        continue
      }

      const vdiData: VdiDataItem = {
        uuid: vdi.uuid,
        name_label: vdi.name_label,
        size: vdi.size,
        usage: vdi.usage,
        sr_uuid: sr.uuid,
        sr_name: sr.name_label,
        sr_type: sr.SR_type ?? '',
        pool_id: sr.$poolId,
        pool_name: poolLabelMap.get(sr.$poolId) ?? '',
      }

      // Resolve attached VM via VBDs (use first found VM)
      for (const vbdId of vdi.$VBDs) {
        const vbd = allVbds[vbdId]
        if (vbd !== undefined) {
          const vm = vmById.get(vbd.VM)
          if (vm !== undefined) {
            vdiData.vm_uuid = vm.uuid
            vdiData.vm_name = vm.name_label
            break
          }
        }
      }

      vdis.push(vdiData)
    }

    logger.debug('Returning VDI data', { vdiCount: vdis.length })
    return { vdis }
  }

  /**
   * Get host status data for all hosts.
   * Returns power_state and enabled for every host, including non-running ones.
   */
  #getHostStatusData(): HostStatusPayload {
    const hosts: HostStatusItem[] = []

    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>

    for (const host of Object.values(allHosts)) {
      hosts.push({
        uuid: host.uuid,
        name_label: host.name_label,
        power_state: host.power_state,
        enabled: host.enabled,
        pool_id: host.$poolId,
        pool_name: poolLabelMap.get(host.$poolId) ?? '',
      })
    }

    logger.debug('Returning host status data', { hostCount: hosts.length })
    return { hosts }
  }

  /**
   * Get VM status data for all VMs (excluding VM-controllers / dom0).
   * Returns power_state for every VM.
   */
  #getVmStatusData(): VmStatusPayload {
    const vms: VmStatusItem[] = []

    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    const allVms = this.#xo.getObjects({ filter: { type: 'VM' } }) as Record<string, XoVm>

    for (const vm of Object.values(allVms)) {
      vms.push({
        uuid: vm.uuid,
        name_label: vm.name_label,
        power_state: vm.power_state,
        pool_id: vm.$poolId,
        pool_name: poolLabelMap.get(vm.$poolId) ?? '',
      })
    }

    logger.debug('Returning VM status data', { vmCount: vms.length })
    return { vms }
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
  #getXostorData(): Promise<XostorPayload> {
    return this.#xostorHealthCheckCache.get(() => this.#collectXostorData())
  }

  async #collectXostorData(): Promise<XostorPayload> {
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
    const allPbds = this.#xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>

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
        const xapi = this.#xo.getXapi(sr)
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
  #getXostorAlarms(): XostorAlarmsPayload {
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
    const xostorSrs = Object.values(allSrs).filter(sr => sr.SR_type === 'linstor')

    // Skip the (potentially expensive) message-store scan on non-XOSTOR
    // deployments. The message store on a busy XAPI can be in the thousands.
    if (xostorSrs.length === 0) {
      return { clusters: [] }
    }

    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const allPbds = this.#xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>
    const allMessages = this.#xo.getObjects({ filter: { type: 'message' } }) as Record<string, XoMessage>

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
  #getXostorSmartHealth(): Promise<XostorSmartPayload> {
    return this.#xostorSmartCache.get(() => this.#collectXostorSmartHealth())
  }

  async #collectXostorSmartHealth(): Promise<XostorSmartPayload> {
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
    const allPbds = this.#xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>

    const tasks: Array<Promise<XostorSmartHost>> = []
    for (const sr of Object.values(allSrs)) {
      if (sr.SR_type !== 'linstor') continue

      const poolName = allPools[sr.$poolId]?.name_label ?? ''

      for (const hostId of xostorHostIdsFromPbds(sr, allPbds)) {
        const host = allHosts[hostId]
        if (host === undefined) continue

        tasks.push(this.#fetchHostSmart(sr, poolName, host))
      }
    }

    const hosts = await Promise.all(tasks)
    logger.debug('Returning XOSTOR SMART data', { hostCount: hosts.length })
    return { hosts }
  }

  async #fetchHostSmart(sr: XoSr, poolName: string, host: XoHost): Promise<XostorSmartHost> {
    const base = {
      sr_uuid: sr.uuid,
      pool_id: sr.$poolId,
      pool_name: poolName,
      host_uuid: host.uuid,
      host_name: host.name_label,
    }

    try {
      const xapi = this.#xo.getXapi(sr)
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
  #getXostorUpdates(): Promise<XostorUpdatesPayload> {
    return this.#xostorUpdatesCache.get(() => this.#collectXostorUpdates())
  }

  async #collectXostorUpdates(): Promise<XostorUpdatesPayload> {
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
    const allPbds = this.#xo.getObjects({ filter: { type: 'PBD' } }) as Record<string, XoPbd>

    const tasks: Array<Promise<XostorUpdateItem>> = []
    for (const sr of Object.values(allSrs)) {
      if (sr.SR_type !== 'linstor') continue

      const poolName = allPools[sr.$poolId]?.name_label ?? ''

      for (const hostId of xostorHostIdsFromPbds(sr, allPbds)) {
        const host = allHosts[hostId]
        if (host === undefined) continue

        tasks.push(this.#fetchHostUpdates(sr, poolName, host))
      }
    }

    const hosts = await Promise.all(tasks)
    logger.debug('Returning XOSTOR pending updates', { hostCount: hosts.length })
    return { hosts }
  }

  async #fetchHostUpdates(sr: XoSr, poolName: string, host: XoHost): Promise<XostorUpdateItem> {
    const base = {
      sr_uuid: sr.uuid,
      pool_id: sr.$poolId,
      pool_name: poolName,
      host_uuid: host.uuid,
      host_name: host.name_label,
    }

    try {
      const xapi = this.#xo.getXapi(sr)
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

  /**
   * Collect XO management plane metrics.
   * Gathers counts and stats from XO objects and XO APIs.
   */
  async #getXoMetrics(): Promise<XoMetricsData> {
    const allObjects = this.#xo.getObjects() as Record<string, XoObject>

    let poolCount = 0
    let hostCount = 0
    let vmCount = 0
    let socketCount = 0
    let pendingTask = 0
    for await (const _taskLog of this.#xo.tasks.list({ filter: _ => _.status === 'pending' })) {
      pendingTask++
    }
    const srCountByContentType: Record<string, number> = {}
    const hostVersionMap = new Map<string, number>()
    const hostLicenseMap = new Map<string, number>()

    for (const obj of Object.values(allObjects)) {
      switch (obj.type) {
        case 'pool':
          poolCount++
          break
        case 'host': {
          const host = obj as XoHost
          hostCount++
          socketCount += (host.cpus as { sockets?: number } | undefined)?.sockets ?? 0

          const versionKey = `${host.productBrand ?? ''}::${host.version ?? ''}`
          hostVersionMap.set(versionKey, (hostVersionMap.get(versionKey) ?? 0) + 1)

          const skuType = (host.license_params as Record<string, string> | undefined)?.sku_type ?? '?'
          hostLicenseMap.set(skuType, (hostLicenseMap.get(skuType) ?? 0) + 1)
          break
        }
        case 'VM':
          vmCount++
          break
        case 'SR': {
          const contentType = (obj as unknown as Record<string, string>).content_type ?? 'unknown'
          srCountByContentType[contentType] = (srCountByContentType[contentType] ?? 0) + 1
          break
        }
      }
    }

    const hostCountByVersion = [...hostVersionMap.entries()].map(([key, count]) => {
      const [productBrand = '', version = ''] = key.split('::')
      return { productBrand, version, count }
    })

    const hostCountByLicense = [...hostLicenseMap.entries()].map(([skuType, count]) => ({ skuType, count }))

    let userCount = 0
    try {
      const users = await this.#xo.getAllUsers()
      userCount = users.length
    } catch (err) {
      logger.warn('Failed to get users for XO metrics', { error: err })
    }

    let groupCount = 0
    try {
      const groups = await this.#xo.getAllGroups()
      groupCount = groups.length
    } catch (err) {
      logger.warn('Failed to get groups for XO metrics', { error: err })
    }

    const backupJobStats: XoMetricsData['backupJobStats'] = []
    try {
      const jobs = await this.#xo.getAllJobs()

      const jobCountByKey = new Map<string, number>()
      for (const job of jobs) {
        const key = (job as Record<string, unknown>).key as string | undefined
        if (key === undefined || key === 'genericTask') continue
        jobCountByKey.set(key, (jobCountByKey.get(key) ?? 0) + 1)
      }

      for (const [type, jobCount] of jobCountByKey) {
        backupJobStats.push({ type, jobCount })
      }
    } catch (err) {
      logger.warn('Failed to get backup job stats for XO metrics', { error: err })
    }

    // Node.js process metrics
    const samples = this.#eluSamples
    this.#eluSamples = []
    let eluMean = 0
    let eluP99 = 0
    let eluMax = 0
    if (samples.length > 0) {
      const sorted = [...samples].sort((a, b) => a - b)
      eluMean = samples.reduce((sum, v) => sum + v, 0) / samples.length
      eluMax = sorted[sorted.length - 1]!
      eluP99 = sorted[Math.max(0, Math.ceil(0.99 * sorted.length) - 1)]!
    }

    const cpuDelta = process.cpuUsage(this.#lastCpuUsage)
    this.#lastCpuUsage = process.cpuUsage()
    const mem = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()

    logger.debug('XO metrics collected', { poolCount, hostCount, vmCount, userCount, groupCount })

    return {
      pendingTaskCount: pendingTask,
      poolCount,
      hostCount,
      vmCount,
      srCountByContentType,
      userCount,
      groupCount,
      socketCount,
      hostCountByVersion,
      hostCountByLicense,
      backupJobStats,
      nodeProcess: {
        eluMean,
        eluP99,
        eluMax,
        memoryRssBytes: mem.rss,
        memoryHeapUsedBytes: mem.heapUsed,
        memoryHeapTotalBytes: mem.heapTotal,
        memoryExternalBytes: mem.external,
        memoryArrayBuffersBytes: mem.arrayBuffers,
        heapSizeLimitBytes: heapStats.heap_size_limit,
        heapAvailableBytes: heapStats.total_available_size,
        detachedContexts: heapStats.number_of_detached_contexts,
        cpuUserSeconds: cpuDelta.user / 1_000_000,
        cpuSystemSeconds: cpuDelta.system / 1_000_000,
      },
    }
  }

  /**
   * Get label lookup data for enriching metrics with human-readable names.
   * Gathers VM, Host, SR, VDI, VIF, PIF, and Network labels.
   */
  #getLabelLookupData(): LabelLookupData {
    const labels: LabelLookupData = {
      vms: {},
      hosts: {},
      srs: {},
      srTruncatedToUuid: {},
      vdiUuidToSrUuid: {},
    }

    // Get all objects and categorize them by type in a single pass
    const allObjects = this.#xo.getObjects() as Record<XoObject['id'], XoObject>

    const vms: (XoVm | XoVmController)[] = []
    const hosts: XoHost[] = []
    const pools: XoPool[] = []
    const srs: XoSr[] = []
    const vbds: XoVbd[] = []
    const vdis: XoVdi[] = []
    const vifs: XoVif[] = []
    const pifs: XoPif[] = []
    const networks: XoNetwork[] = []

    for (const obj of Object.values(allObjects)) {
      switch (obj.type) {
        case 'VM':
        case 'VM-controller':
          vms.push(obj)
          break
        case 'host':
          hosts.push(obj)
          break
        case 'pool':
          pools.push(obj as XoPool)
          break
        case 'SR':
          srs.push(obj)
          break
        case 'VBD':
          vbds.push(obj)
          break
        case 'VDI':
          vdis.push(obj)
          break
        case 'VIF':
          vifs.push(obj)
          break
        case 'PIF':
          pifs.push(obj)
          break
        case 'network':
          networks.push(obj)
          break
      }
    }

    // Build pool label map (uuid -> name_label) for VM enrichment
    const poolLabelMap = new Map<string, string>()
    for (const pool of pools) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    // Build network name map (id -> name_label)
    const networkNameById = new Map<XoNetwork['id'], string>()
    for (const network of networks) {
      networkNameById.set(network.id, network.name_label)
    }

    // Build VDI name map (uuid -> name_label) and VDI UUID to SR UUID map
    // Note: vdi.id === vdi.uuid for VDI objects
    const vdiNameByUuid = new Map<XoVdi['uuid'], string>()
    for (const vdi of vdis) {
      vdiNameByUuid.set(vdi.uuid, vdi.name_label)
      // Build VDI UUID -> SR UUID mapping
      if (vdi.$SR !== undefined) {
        const srObj = allObjects[vdi.$SR]
        if (srObj !== undefined && srObj.type === 'SR') {
          labels.vdiUuidToSrUuid[vdi.uuid] = srObj.uuid
        }
      }
    }

    // Build VBD map (VM id -> device -> VDI info)
    // Note: vbd.VDI is already the VDI UUID (id === uuid for VDI objects)
    const vbdMap = new Map<XoVbd['VM'], Map<string, { name: string; uuid: string }>>()
    for (const vbd of vbds) {
      if (vbd.device === null || vbd.device === '' || vbd.VDI == null) continue

      let vmVbds = vbdMap.get(vbd.VM)
      if (vmVbds === undefined) {
        vmVbds = new Map<string, { name: string; uuid: string }>()
        vbdMap.set(vbd.VM, vmVbds)
      }

      const vdiUuid = vbd.VDI
      const vdiName = vdiNameByUuid.get(vdiUuid)
      if (vdiName !== undefined) {
        vmVbds.set(vbd.device, { name: vdiName, uuid: vdiUuid })
      }
    }

    // Build VIF map (VM id -> vif index -> network name)
    const vifMap = new Map<XoVm['id'] | XoVmController['id'], Map<string, string>>()
    for (const vif of vifs) {
      // VIF device is the index (0, 1, 2...)
      if (vif.$VM === undefined) continue

      let vmVifs = vifMap.get(vif.$VM)
      if (vmVifs === undefined) {
        vmVifs = new Map<string, string>()
        vifMap.set(vif.$VM, vmVifs)
      }

      const networkName = networkNameById.get(vif.$network)
      if (networkName !== undefined) {
        vmVifs.set(vif.device, networkName)
      }
    }

    // Build PIF map (Host id -> device -> network name)
    const pifMap = new Map<XoPif['$host'], Map<string, string>>()
    for (const pif of pifs) {
      let hostPifs = pifMap.get(pif.$host)
      if (hostPifs === undefined) {
        hostPifs = new Map<string, string>()
        pifMap.set(pif.$host, hostPifs)
      }

      const networkName = networkNameById.get(pif.$network)
      if (networkName !== undefined) {
        hostPifs.set(pif.device, networkName)
      }
    }

    // Build VM labels
    for (const vm of vms) {
      const vbdDeviceToVdiName: Record<string, string> = {}
      const vbdDeviceToVdiUuid: Record<string, string> = {}
      const vmVbds = vbdMap.get(vm.id)
      if (vmVbds !== undefined) {
        for (const [device, vdiInfo] of vmVbds) {
          vbdDeviceToVdiName[device] = vdiInfo.name
          vbdDeviceToVdiUuid[device] = vdiInfo.uuid
        }
      }

      const vifIndexToNetworkName: Record<string, string> = {}
      const vmVifs = vifMap.get(vm.id)
      if (vmVifs !== undefined) {
        for (const [index, networkName] of vmVifs) {
          vifIndexToNetworkName[index] = networkName
        }
      }

      labels.vms[vm.uuid] = {
        name_label: vm.name_label,
        is_control_domain: vm.type === 'VM-controller',
        vbdDeviceToVdiName,
        vbdDeviceToVdiUuid,
        vifIndexToNetworkName,
        startTime: vm.startTime ?? null,
        power_state: vm.power_state,
        pool_id: vm.$poolId,
        pool_name: poolLabelMap.get(vm.$poolId) ?? '',
      }
    }

    // Build Host labels
    for (const host of hosts) {
      const pifDeviceToNetworkName: Record<string, string> = {}
      const hostPifs = pifMap.get(host.id)
      if (hostPifs !== undefined) {
        for (const [device, networkName] of hostPifs) {
          pifDeviceToNetworkName[device] = networkName
        }
      }

      labels.hosts[host.uuid] = {
        name_label: host.name_label,
        pifDeviceToNetworkName,
        startTime: host.startTime,
      }
    }

    for (const sr of srs) {
      labels.srs[sr.uuid] = {
        name_label: sr.name_label,
        SR_type: sr.SR_type ?? '',
      }
      indexSrUuidTruncations(sr.uuid, labels.srTruncatedToUuid)
    }

    logger.debug('Label lookup data built', {
      vmCount: Object.keys(labels.vms).length,
      hostCount: Object.keys(labels.hosts).length,
      srCount: Object.keys(labels.srs).length,
    })

    return labels
  }

  /**
   * Send a message to the child process.
   */
  #sendToChild(message: IpcMessage): void {
    const child = this.#childProcess
    if (child === undefined) {
      throw new Error('Child process not running')
    }

    child.send(message)
  }

  /**
   * Send a message to the child process without throwing if not running.
   */
  #sendToChildNoWait(message: IpcMessage): void {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    child.send(message)
  }

  /**
   * Wait for the child process to be ready.
   */
  #waitForReady(): Promise<void> {
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
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })
    })
  }

  /**
   * Resolve a pending request.
   */
  #resolvePendingRequest(requestId: string, value: unknown): void {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.resolve(value)
    }
  }

  /**
   * Reject a pending request.
   */
  #rejectPendingRequest(requestId: string, error: Error): void {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.reject(error)
    }
  }

  /**
   * Reject all pending requests.
   */
  #rejectAllPendingRequests(error: Error): void {
    for (const pending of this.#pendingRequests.values()) {
      pending.reject(error)
    }
    this.#pendingRequests.clear()
  }
}

// ============================================================================
// Plugin Factory (exported for xo-server)
// ============================================================================

interface PluginOptions {
  xo: XoApp
}

function pluginFactory({ xo }: PluginOptions): OpenMetricsPlugin {
  return new OpenMetricsPlugin(xo)
}
pluginFactory.configurationSchema = configurationSchema

export default pluginFactory
