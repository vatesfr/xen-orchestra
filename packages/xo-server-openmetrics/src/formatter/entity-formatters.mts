/**
 * OpenMetrics Formatter — Entity Formatters
 *
 * Formats XO object data (SRs, VDIs, host/VM status, host/VM uptime) into
 * OpenMetrics entries. These are derived from XO objects, not RRD data.
 */

import type { HostStatusItem, SrDataItem, VdiDataItem, VmStatusItem } from '../types/domain.mjs'

import { METRIC_PREFIX, type FormattedMetric, type LabelContext } from './primitives.mjs'

/**
 * Format SR capacity metrics to OpenMetrics format.
 *
 * Creates FormattedMetric entries for each SR's capacity metrics:
 * - virtual_size (usage/virtual_allocation)
 * - physical_size (size)
 * - physical_usage
 *
 * For local (non-shared) SRs, host_id and host_name labels are included.
 *
 * @param srDataList - Array of SR data with capacity information
 * @returns Array of FormattedMetric entries for SR capacity
 */
export function formatSrMetrics(srDataList: SrDataItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const sr of srDataList) {
    const baseLabels: Record<string, string> = {
      pool_id: sr.pool_id,
      sr_uuid: sr.uuid,
      sr_name: sr.name_label,
    }

    if (sr.pool_name !== '') {
      baseLabels.pool_name = sr.pool_name
    }
    if (sr.sr_type !== '') {
      baseLabels.sr_type = sr.sr_type
    }

    // For local SRs, add host information
    if (sr.host_id !== undefined) {
      baseLabels.host_id = sr.host_id
    }
    if (sr.host_name !== undefined) {
      baseLabels.host_name = sr.host_name
    }

    // Virtual size (virtual_allocation)
    metrics.push({
      name: `${METRIC_PREFIX}_sr_virtual_size_bytes`,
      help: 'SR virtual allocated size in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: sr.usage,
      timestamp,
    })

    // Physical size
    metrics.push({
      name: `${METRIC_PREFIX}_sr_physical_size_bytes`,
      help: 'SR physical size in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: sr.size,
      timestamp,
    })

    // Physical usage
    metrics.push({
      name: `${METRIC_PREFIX}_sr_physical_usage_bytes`,
      help: 'SR physical space used in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: sr.physical_usage,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format VDI disk size metrics.
 *
 * Creates two FormattedMetric entries per VDI:
 * - virtual_size_bytes (virtual disk size)
 * - physical_usage_bytes (actual space allocated on SR)
 *
 * Labels include pool, SR, VDI identifiers, and optionally VM info if attached.
 *
 * @param vdiDataList - Array of VDI data with size information
 * @returns Array of FormattedMetric entries for VDI disk sizes
 */
export function formatVdiMetrics(vdiDataList: VdiDataItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const vdi of vdiDataList) {
    const baseLabels: Record<string, string> = {
      pool_id: vdi.pool_id,
      sr_uuid: vdi.sr_uuid,
      sr_name: vdi.sr_name,
      vdi_uuid: vdi.uuid,
      vdi_name: vdi.name_label,
    }

    if (vdi.pool_name !== '') {
      baseLabels.pool_name = vdi.pool_name
    }
    if (vdi.sr_type !== '') {
      baseLabels.sr_type = vdi.sr_type
    }

    // Add VM labels if VDI is attached to a VM
    if (vdi.vm_uuid !== undefined) {
      baseLabels.vm_uuid = vdi.vm_uuid
    }
    if (vdi.vm_name !== undefined) {
      baseLabels.vm_name = vdi.vm_name
    }

    // Virtual size
    metrics.push({
      name: `${METRIC_PREFIX}_vdi_virtual_size_bytes`,
      help: 'VDI virtual size in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: vdi.size,
      timestamp,
    })

    // Physical usage (allocated on SR)
    metrics.push({
      name: `${METRIC_PREFIX}_vdi_physical_usage_bytes`,
      help: 'VDI physical space used in bytes (allocated on SR)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: vdi.usage,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format host status metrics.
 *
 * Creates one FormattedMetric per host with power_state and enabled labels.
 *
 * @param hostStatusList - Array of host status data
 * @returns Array of FormattedMetric entries for host status
 */
export function formatHostStatusMetrics(hostStatusList: HostStatusItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const host of hostStatusList) {
    const labels: Record<string, string> = {
      pool_id: host.pool_id,
      uuid: host.uuid,
      host_name: host.name_label,
      power_state: host.power_state,
      enabled: String(host.enabled),
    }

    if (host.pool_name !== '') {
      labels.pool_name = host.pool_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_host_status`,
      help: 'Host status (1 = current state)',
      type: 'gauge',
      labels,
      value: 1,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format VM status metrics.
 *
 * Creates one FormattedMetric per VM with power_state label.
 *
 * @param vmStatusList - Array of VM status data
 * @returns Array of FormattedMetric entries for VM status
 */
export function formatVmStatusMetrics(vmStatusList: VmStatusItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const vm of vmStatusList) {
    const labels: Record<string, string> = {
      pool_id: vm.pool_id,
      uuid: vm.uuid,
      power_state: vm.power_state,
    }

    if (vm.pool_name !== '') {
      labels.pool_name = vm.pool_name
    }

    if (vm.name_label !== '') {
      labels.vm_name = vm.name_label
    }

    metrics.push({
      name: `${METRIC_PREFIX}_vm_status`,
      help: 'VM power state indicator (always 1; current state is carried by the power_state label)',
      type: 'gauge',
      labels,
      value: 1,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format host uptime metrics to OpenMetrics format.
 *
 * Creates a FormattedMetric entry for each host's uptime, calculated as
 * the difference between current time and host.startTime (boot time).
 *
 * @param labelContext - Label context containing host credentials and label lookup data
 * @returns Array of FormattedMetric entries for host uptime
 */
export function formatHostUptimeMetrics(labelContext: LabelContext): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const now = Math.floor(Date.now() / 1000)

  for (const host of labelContext.hosts) {
    const hostInfo = labelContext.labels.hosts[host.hostId]
    if (hostInfo === undefined || hostInfo.startTime === null) {
      continue
    }

    const uptimeSeconds = now - hostInfo.startTime

    const labels: Record<string, string> = {
      pool_id: host.poolId,
      uuid: host.hostId,
    }

    if (host.poolLabel !== '') {
      labels.pool_name = host.poolLabel
    }

    if (hostInfo.name_label !== '') {
      labels.host_name = hostInfo.name_label
    }

    metrics.push({
      name: `${METRIC_PREFIX}_host_uptime_seconds`,
      help: 'Host uptime in seconds since boot',
      type: 'gauge',
      labels,
      value: uptimeSeconds,
      timestamp: now,
    })
  }

  return metrics
}

/**
 * Format VM uptime metrics to OpenMetrics format.
 *
 * Creates a FormattedMetric entry for each VM's uptime, calculated as
 * the difference between current time and vm.startTime (boot time).
 * VM-controllers (dom0) are excluded.
 *
 * @param labelContext - Label context containing host credentials and label lookup data
 * @returns Array of FormattedMetric entries for VM uptime
 */
export function formatVmUptimeMetrics(labelContext: LabelContext): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const now = Math.floor(Date.now() / 1000)

  for (const [vmUuid, vmInfo] of Object.entries(labelContext.labels.vms)) {
    if (vmInfo.is_control_domain) {
      continue
    }

    // Only emit uptime for running VMs — halted/suspended VMs retain stale startTime
    if (vmInfo.power_state !== 'Running') {
      continue
    }

    if (vmInfo.startTime === null || vmInfo.startTime === undefined) {
      continue
    }

    const uptimeSeconds = Math.max(0, now - vmInfo.startTime)

    const labels: Record<string, string> = {
      pool_id: vmInfo.pool_id,
      uuid: vmUuid,
    }

    if (vmInfo.pool_name !== '') {
      labels.pool_name = vmInfo.pool_name
    }

    if (vmInfo.name_label !== '') {
      labels.vm_name = vmInfo.name_label
    }

    metrics.push({
      name: `${METRIC_PREFIX}_vm_uptime_seconds`,
      help: 'VM uptime in seconds since boot',
      type: 'gauge',
      labels,
      value: uptimeSeconds,
      timestamp: now,
    })
  }

  return metrics
}
