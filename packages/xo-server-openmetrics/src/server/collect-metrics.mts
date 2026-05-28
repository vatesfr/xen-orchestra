/**
 * Metrics collection — child process.
 *
 * Orchestrates the per-`/metrics` data gathering: requests credentials and the
 * various payloads from the parent over IPC, fetches RRD data from every host
 * with bounded concurrency, then hands the gathered data to the pure
 * `assembleMetrics` tail which concatenates the formatter outputs in a fixed
 * order and returns the final OpenMetrics document.
 *
 * `assembleMetrics` is a pure function (no I/O) so it can be exercised directly
 * by the assembly characterization test.
 */

import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

import type { ParsedRrdData } from '../rrd-parser.mjs'
import {
  formatAllPoolsToOpenMetrics,
  formatHostStatusMetrics,
  formatHostUptimeMetrics,
  formatSrMetrics,
  formatToOpenMetrics,
  formatVdiMetrics,
  formatVmStatusMetrics,
  formatVmUptimeMetrics,
  formatXoMetrics,
  formatXostorAlarmsMetrics,
  formatXostorClusterMetrics,
  formatXostorSmartMetrics,
  formatXostorUpdatesMetrics,
  type LabelContext,
  type XoMetricsData,
  type XostorAlarmsPayload,
  type XostorPayload,
  type XostorSmartPayload,
  type XostorUpdatesPayload,
} from '../openmetric-formatter.mjs'
import type { HostStatusItem, SrDataItem, VdiDataItem, VmStatusItem } from '../types/domain.mjs'
import {
  requestHostStatusData,
  requestSrData,
  requestVdiData,
  requestVmStatusData,
  requestXapiCredentials,
  requestXoMetrics,
  requestXostorAlarms,
  requestXostorData,
  requestXostorSmart,
  requestXostorUpdates,
  safeXostorRequest,
} from './request-client.mjs'
import { fetchRrdFromHost } from './rrd-fetcher.mjs'

const logger = createLogger('xo:xo-server-openmetrics:child')

// ============================================================================
// Constants
// ============================================================================

const RRD_FETCH_CONCURRENCY = 5 // Limit parallel RRD requests to avoid overwhelming XAPI

// ============================================================================
// Metrics Assembly (pure)
// ============================================================================

/**
 * Already-gathered inputs consumed by `assembleMetrics`. Mirrors the data
 * `collectMetrics` has on hand once all IPC requests and RRD fetches resolve.
 */
export interface CollectInput {
  credentials: LabelContext
  srData: { srs: SrDataItem[] }
  vdiData: { vdis: VdiDataItem[] }
  hostStatusData: { hosts: HostStatusItem[] }
  vmStatusData: { vms: VmStatusItem[] }
  xoMetricsData: XoMetricsData
  xostorData: XostorPayload
  xostorAlarms: XostorAlarmsPayload
  xostorSmart: XostorSmartPayload
  xostorUpdates: XostorUpdatesPayload
  rrdDataList: ParsedRrdData[]
}

/**
 * Pure tail of `collectMetrics`: given already-fetched data, concatenate the
 * formatter outputs in the fixed canonical order and return the OpenMetrics
 * document ending with `# EOF`.
 */
export function assembleMetrics(data: CollectInput): string {
  const {
    credentials,
    srData,
    vdiData,
    hostStatusData,
    vmStatusData,
    xoMetricsData,
    xostorData,
    xostorAlarms,
    xostorSmart,
    xostorUpdates,
    rrdDataList,
  } = data

  if (credentials.hosts.length === 0) {
    return '# No connected hosts\n# EOF'
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

  // Format VDI disk size metrics
  const vdiMetrics = formatVdiMetrics(vdiData.vdis)
  const vdiMetricsOutput = vdiMetrics.length > 0 ? formatToOpenMetrics(vdiMetrics) : ''
  logger.debug('Formatted VDI metrics', { vdiCount: vdiMetrics.length })

  // Format host status metrics
  const hostStatusMetrics = formatHostStatusMetrics(hostStatusData.hosts)
  const hostStatusOutput = hostStatusMetrics.length > 0 ? formatToOpenMetrics(hostStatusMetrics) : ''
  logger.debug('Formatted host status metrics', { hostCount: hostStatusMetrics.length })

  // Format host uptime metrics
  const uptimeMetrics = formatHostUptimeMetrics(credentials)
  const uptimeMetricsOutput = uptimeMetrics.length > 0 ? formatToOpenMetrics(uptimeMetrics) : ''
  logger.debug('Formatted host uptime metrics', { hostCount: uptimeMetrics.length })

  // Format VM status metrics
  const vmStatusMetrics = formatVmStatusMetrics(vmStatusData.vms)
  const vmStatusOutput = vmStatusMetrics.length > 0 ? formatToOpenMetrics(vmStatusMetrics) : ''
  logger.debug('Formatted VM status metrics', { vmCount: vmStatusMetrics.length })

  // Format VM uptime metrics
  const vmUptimeMetrics = formatVmUptimeMetrics(credentials)
  const vmUptimeOutput = vmUptimeMetrics.length > 0 ? formatToOpenMetrics(vmUptimeMetrics) : ''
  logger.debug('Formatted VM uptime metrics', { vmCount: vmUptimeMetrics.length })

  // Format XO management plane metrics
  const xoMetrics = formatXoMetrics(xoMetricsData)
  const xoMetricsOutput = xoMetrics.length > 0 ? formatToOpenMetrics(xoMetrics) : ''
  logger.debug('Formatted XO metrics', { count: xoMetrics.length })

  // Format XOSTOR cluster metrics
  const xostorMetrics = formatXostorClusterMetrics(xostorData)
  const xostorMetricsOutput = xostorMetrics.length > 0 ? formatToOpenMetrics(xostorMetrics) : ''
  logger.debug('Formatted XOSTOR metrics', { count: xostorMetrics.length })

  // Format XOSTOR alarm metrics
  const xostorAlarmsMetrics = formatXostorAlarmsMetrics(xostorAlarms)
  const xostorAlarmsOutput = xostorAlarmsMetrics.length > 0 ? formatToOpenMetrics(xostorAlarmsMetrics) : ''
  logger.debug('Formatted XOSTOR alarm metrics', { count: xostorAlarmsMetrics.length })

  // Format XOSTOR SMART metrics
  const xostorSmartMetrics = formatXostorSmartMetrics(xostorSmart)
  const xostorSmartOutput = xostorSmartMetrics.length > 0 ? formatToOpenMetrics(xostorSmartMetrics) : ''
  logger.debug('Formatted XOSTOR SMART metrics', { count: xostorSmartMetrics.length })

  // Format XOSTOR pending-updates metrics
  const xostorUpdatesMetrics = formatXostorUpdatesMetrics(xostorUpdates)
  const xostorUpdatesOutput = xostorUpdatesMetrics.length > 0 ? formatToOpenMetrics(xostorUpdatesMetrics) : ''
  logger.debug('Formatted XOSTOR update metrics', { count: xostorUpdatesMetrics.length })

  // Combine pool metrics with RRD metrics, SR metrics, host status metrics, uptime metrics, and XO metrics
  // Remove the # EOF from rrdMetrics if present (we'll add our own)
  const rrdMetricsWithoutEof = rrdMetrics.replace(/\n# EOF$/, '')

  const allMetricsSections = [poolMetrics.join('\n')]

  if (rrdMetricsWithoutEof !== '') {
    allMetricsSections.push(rrdMetricsWithoutEof)
  }

  if (srMetricsOutput !== '') {
    allMetricsSections.push(srMetricsOutput)
  }

  if (vdiMetricsOutput !== '') {
    allMetricsSections.push(vdiMetricsOutput)
  }

  if (hostStatusOutput !== '') {
    allMetricsSections.push(hostStatusOutput)
  }

  if (uptimeMetricsOutput !== '') {
    allMetricsSections.push(uptimeMetricsOutput)
  }

  if (vmStatusOutput !== '') {
    allMetricsSections.push(vmStatusOutput)
  }

  if (vmUptimeOutput !== '') {
    allMetricsSections.push(vmUptimeOutput)
  }

  if (xoMetricsOutput !== '') {
    allMetricsSections.push(xoMetricsOutput)
  }

  if (xostorMetricsOutput !== '') {
    allMetricsSections.push(xostorMetricsOutput)
  }

  if (xostorAlarmsOutput !== '') {
    allMetricsSections.push(xostorAlarmsOutput)
  }

  if (xostorSmartOutput !== '') {
    allMetricsSections.push(xostorSmartOutput)
  }

  if (xostorUpdatesOutput !== '') {
    allMetricsSections.push(xostorUpdatesOutput)
  }

  return allMetricsSections.join('\n') + '\n# EOF'
}

// ============================================================================
// Metrics Collection (orchestration)
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
export async function collectMetrics(): Promise<string> {
  const [
    credentials,
    srData,
    vdiData,
    hostStatusData,
    vmStatusData,
    xoMetricsData,
    xostorData,
    xostorAlarms,
    xostorSmart,
    xostorUpdates,
  ] = await Promise.all([
    requestXapiCredentials(),
    requestSrData(),
    requestVdiData(),
    requestHostStatusData(),
    requestVmStatusData(),
    requestXoMetrics(),
    safeXostorRequest(requestXostorData(), 'data', { clusters: [] } as XostorPayload),
    safeXostorRequest(requestXostorAlarms(), 'alarms', { clusters: [] } as XostorAlarmsPayload),
    safeXostorRequest(requestXostorSmart(), 'SMART', { hosts: [] } as XostorSmartPayload),
    safeXostorRequest(requestXostorUpdates(), 'updates', { hosts: [] } as XostorUpdatesPayload),
  ])

  logger.debug('Collecting metrics', {
    hostCount: credentials.hosts.length,
    srCount: srData.srs.length,
    vdiCount: vdiData.vdis.length,
    hostStatusCount: hostStatusData.hosts.length,
    vmStatusCount: vmStatusData.vms.length,
    xostorClusterCount: xostorData.clusters.length,
    xostorAlarmClusterCount: xostorAlarms.clusters.length,
    xostorSmartHostCount: xostorSmart.hosts.length,
    xostorUpdatesHostCount: xostorUpdates.hosts.length,
  })

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

  return assembleMetrics({
    credentials,
    srData,
    vdiData,
    hostStatusData,
    vmStatusData,
    xoMetricsData,
    xostorData,
    xostorAlarms,
    xostorSmart,
    xostorUpdates,
    rrdDataList,
  })
}
