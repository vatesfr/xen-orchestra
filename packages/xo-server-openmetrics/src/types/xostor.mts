/**
 * XOSTOR (LINSTOR-backed SR) types.
 *
 * TYPE declarations only (erased at compile time). Moved verbatim out of
 * `index.mts`; the runtime `XOSTOR_UPDATE_PACKAGES` set stays in `index.mts`
 * for now and is re-exported from there.
 */

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

export type { XostorHealthCheckRaw }
