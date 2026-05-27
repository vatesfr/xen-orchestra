/**
 * XOSTOR (LINSTOR-backed SR) metric formatters.
 *
 * Pure functions moved verbatim out of `openmetric-formatter.mts`. They turn
 * the typed XOSTOR payloads (cluster health, alarms, SMART, pending updates)
 * into `FormattedMetric[]` ready for `formatToOpenMetrics`.
 *
 * Pure (no instance/process state) — safe to import from either process.
 */

import type { XostorAlarmsPayload, XostorPayload, XostorSmartPayload, XostorUpdatesPayload } from '../types/xostor.mjs'

import { METRIC_PREFIX, type FormattedMetric } from '../formatter/primitives.mjs'

/**
 * Format XOSTOR cluster metrics derived from `linstor-manager.healthCheck`.
 *
 * Produces three metric families per detected LINSTOR-backed SR:
 *  - `xcp_xostor_up` (gauge): 1 when healthCheck succeeded, 0 otherwise.
 *    Acts as a collection-health signal so a silently-failing cluster shows
 *    up on the dashboard instead of disappearing.
 *  - `xcp_xostor_node_status` (gauge, value = 1): one entry per LINSTOR node,
 *    with `role` (master|satellite) and `state` labels. Following the same
 *    pattern as `xcp_host_status`, the actual state is carried by the label
 *    rather than encoded as a numeric value.
 *  - `xcp_xostor_resource_total` (gauge): total count of LINSTOR resources
 *    in the cluster — Phase 1 analogue of the proposed OSD count.
 */
export function formatXostorClusterMetrics(payload: XostorPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.clusters.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const cluster of payload.clusters) {
    const baseLabels: Record<string, string> = {
      sr_uuid: cluster.sr_uuid,
      pool_id: cluster.pool_id,
    }
    if (cluster.pool_name !== '') {
      baseLabels.pool_name = cluster.pool_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_up`,
      help: 'XOSTOR cluster reachability (1 = healthCheck succeeded, 0 = collection failed)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: cluster.up ? 1 : 0,
      timestamp,
    })

    for (const node of cluster.nodes) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_node_status`,
        help: 'XOSTOR cluster node status (always 1; current state is carried by the role and state labels)',
        type: 'gauge',
        labels: {
          ...baseLabels,
          node_name: node.node_name,
          role: node.role,
          state: node.state,
        },
        value: 1,
        timestamp,
      })
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_resource_total`,
      help: 'Total number of LINSTOR resources defined in the XOSTOR cluster',
      type: 'gauge',
      labels: { ...baseLabels },
      value: cluster.resourceCount,
      timestamp,
    })

    for (const [state, count] of Object.entries(cluster.replicaStates)) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_resource_state_count`,
        help: 'Number of LINSTOR resource replicas in each disk-state across the XOSTOR cluster',
        type: 'gauge',
        labels: { ...baseLabels, state },
        value: count,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XOSTOR active alarm metrics derived from XAPI messages.
 *
 * Two metric families per cluster:
 *  - `xcp_xostor_alarms_up` (gauge): 1 when alarm collection succeeded, 0
 *    otherwise. Mirrors the per-feature collection-status pattern used by
 *    Phase 1's `xcp_xostor_up`.
 *  - `xcp_xostor_alarms_count` (gauge): one series per
 *    (cluster, alarm_name, target_type) carrying the number of matching
 *    XAPI messages. Buckets with zero count are not emitted; their absence
 *    means "no such alarm currently raised".
 *
 * Designed so PromQL alerting rules can express
 * `sum by (sr_uuid) (xcp_xostor_alarms_count) > 0` without per-host knowledge.
 */
export function formatXostorAlarmsMetrics(payload: XostorAlarmsPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.clusters.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const cluster of payload.clusters) {
    const baseLabels: Record<string, string> = {
      sr_uuid: cluster.sr_uuid,
      pool_id: cluster.pool_id,
    }
    if (cluster.pool_name !== '') {
      baseLabels.pool_name = cluster.pool_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_alarms_up`,
      help: 'XOSTOR alarm collection success (1 = collected, 0 = collection failed)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: cluster.up ? 1 : 0,
      timestamp,
    })

    for (const entry of cluster.entries) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_alarms_count`,
        help: 'Number of active XAPI alarm messages targeting a XOSTOR SR or one of its hosts',
        type: 'gauge',
        labels: {
          ...baseLabels,
          alarm_name: entry.alarm_name,
          target_type: entry.target_type,
        },
        value: entry.count,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XOSTOR per-host SMART health metrics derived from `smartctl.py`.
 *
 * Two metric families per XOSTOR host:
 *  - `xcp_xostor_smart_up` (gauge): 1 when the plugin returned data, 0 when
 *    the plugin call failed or `smartctl.py` is not installed on the host.
 *    Always emitted so absence is unambiguous.
 *  - `xcp_xostor_disk_smart_status` (gauge, value=1): one series per
 *    (host, device) carrying the overall-health string as a `status` label.
 *    Following the same pattern as `xcp_host_status` and
 *    `xcp_xostor_node_status`, the actual state lives in a label rather
 *    than the value.
 *
 * The host scope is "every host backing a XOSTOR PBD" — non-XOSTOR disks
 * on these hosts are still relevant because a boot disk failure removes
 * the node from the cluster.
 */
export function formatXostorSmartMetrics(payload: XostorSmartPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.hosts.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const host of payload.hosts) {
    const baseLabels: Record<string, string> = {
      sr_uuid: host.sr_uuid,
      pool_id: host.pool_id,
      host_uuid: host.host_uuid,
    }
    if (host.pool_name !== '') {
      baseLabels.pool_name = host.pool_name
    }
    if (host.host_name !== '') {
      baseLabels.host_name = host.host_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_smart_up`,
      help: 'XOSTOR SMART data collection success per host (1 = smartctl.py replied, 0 = plugin missing or call failed)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: host.up ? 1 : 0,
      timestamp,
    })

    for (const device of host.devices) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_disk_smart_status`,
        help: 'SMART overall-health status per disk on a XOSTOR host (always 1; current status is carried by the status label)',
        type: 'gauge',
        labels: {
          ...baseLabels,
          device: device.device,
          status: device.status,
        },
        value: 1,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XOSTOR pending-update metrics derived from `updater.py check_update`.
 *
 * Two metric families per XOSTOR host:
 *  - `xcp_xostor_updates_up` (gauge): 1 when the plugin returned data, 0
 *    when the call failed or repos are unreachable (e.g. air-gapped hosts).
 *  - `xcp_xostor_package_update_available` (gauge, value=1): one entry per
 *    pending package update on a host. Emitted with a *presence* pattern
 *    (no `0` lines) — absence means "no update pending AND collection
 *    succeeded" (because `_up=1`). Duplicate package entries collapse to a
 *    single series.
 *
 * No `severity` label is exposed: XCP-ng's `updater.py` payload does not
 * carry one and emitting a constant placeholder would mislead operators.
 */
export function formatXostorUpdatesMetrics(payload: XostorUpdatesPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.hosts.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const host of payload.hosts) {
    const baseLabels: Record<string, string> = {
      sr_uuid: host.sr_uuid,
      pool_id: host.pool_id,
      host_uuid: host.host_uuid,
    }
    if (host.pool_name !== '') {
      baseLabels.pool_name = host.pool_name
    }
    if (host.host_name !== '') {
      baseLabels.host_name = host.host_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_updates_up`,
      help: 'XOSTOR update check success per host (1 = updater.py replied, 0 = call failed or repo unreachable)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: host.up ? 1 : 0,
      timestamp,
    })

    const seenPackages = new Set<string>()
    for (const entry of host.packages) {
      if (seenPackages.has(entry.package)) continue
      seenPackages.add(entry.package)

      metrics.push({
        name: `${METRIC_PREFIX}_xostor_package_update_available`,
        help: 'Pending XOSTOR-related package update on a host (always 1; absent means no update pending)',
        type: 'gauge',
        labels: { ...baseLabels, package: entry.package },
        value: 1,
        timestamp,
      })
    }
  }

  return metrics
}
