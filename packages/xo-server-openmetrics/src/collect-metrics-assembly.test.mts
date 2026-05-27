/**
 * Characterization test — /metrics ASSEMBLY contract.
 *
 * Safety net for the openmetrics refactoring (commit 1 of the single-PR split).
 *
 * What this guards: the way `collectMetrics()` (open-metric-server.mts) assembles
 * the final `/metrics` document from the individual formatter outputs — i.e. the
 * SECTION ORDER, pool deduplication, empty-section skipping, the "no connected
 * hosts" short-circuit, and the trailing `# EOF` marker. Nothing covers this today.
 *
 * What this does NOT guard: the exact output of each individual formatter — that is
 * already locked by openmetric-formatter.test.mts (136 tests).
 *
 * `assembleMetrics()` below is a faithful replica of the pure tail of
 * `collectMetrics()` (everything after the I/O data-gathering). In commit 7 that
 * logic will be extracted into a pure `assembleMetrics(data)` function in
 * server/collect-metrics.mts, and this test will be re-pointed to the real export.
 * Until then the replica uses the REAL formatters, so any drift in formatter output
 * during the moves (commit 4) still surfaces here.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

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
} from './openmetric-formatter.mjs'

import type {
  HostStatusItem,
  SrDataItem,
  VdiDataItem,
  VmStatusItem,
  XoMetricsData,
  XostorAlarmsPayload,
  XostorPayload,
  XostorSmartPayload,
  XostorUpdatesPayload,
} from './index.mjs'

import type { ParsedRrdData } from './rrd-parser.mjs'

// ============================================================================
// Assembly logic — faithful replica of collectMetrics()'s pure tail.
// Keep in sync with open-metric-server.mts until commit 7 extracts it.
// ============================================================================

interface CollectInput {
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

function assembleMetrics(data: CollectInput): string {
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

  const rrdMetrics = formatAllPoolsToOpenMetrics(rrdDataList, credentials)

  const srMetrics = formatSrMetrics(srData.srs)
  const srMetricsOutput = srMetrics.length > 0 ? formatToOpenMetrics(srMetrics) : ''

  const vdiMetrics = formatVdiMetrics(vdiData.vdis)
  const vdiMetricsOutput = vdiMetrics.length > 0 ? formatToOpenMetrics(vdiMetrics) : ''

  const hostStatusMetrics = formatHostStatusMetrics(hostStatusData.hosts)
  const hostStatusOutput = hostStatusMetrics.length > 0 ? formatToOpenMetrics(hostStatusMetrics) : ''

  const uptimeMetrics = formatHostUptimeMetrics(credentials)
  const uptimeMetricsOutput = uptimeMetrics.length > 0 ? formatToOpenMetrics(uptimeMetrics) : ''

  const vmStatusMetrics = formatVmStatusMetrics(vmStatusData.vms)
  const vmStatusOutput = vmStatusMetrics.length > 0 ? formatToOpenMetrics(vmStatusMetrics) : ''

  const vmUptimeMetrics = formatVmUptimeMetrics(credentials)
  const vmUptimeOutput = vmUptimeMetrics.length > 0 ? formatToOpenMetrics(vmUptimeMetrics) : ''

  const xoMetrics = formatXoMetrics(xoMetricsData)
  const xoMetricsOutput = xoMetrics.length > 0 ? formatToOpenMetrics(xoMetrics) : ''

  const xostorMetrics = formatXostorClusterMetrics(xostorData)
  const xostorMetricsOutput = xostorMetrics.length > 0 ? formatToOpenMetrics(xostorMetrics) : ''

  const xostorAlarmsMetrics = formatXostorAlarmsMetrics(xostorAlarms)
  const xostorAlarmsOutput = xostorAlarmsMetrics.length > 0 ? formatToOpenMetrics(xostorAlarmsMetrics) : ''

  const xostorSmartMetrics = formatXostorSmartMetrics(xostorSmart)
  const xostorSmartOutput = xostorSmartMetrics.length > 0 ? formatToOpenMetrics(xostorSmartMetrics) : ''

  const xostorUpdatesMetrics = formatXostorUpdatesMetrics(xostorUpdates)
  const xostorUpdatesOutput = xostorUpdatesMetrics.length > 0 ? formatToOpenMetrics(xostorUpdatesMetrics) : ''

  const rrdMetricsWithoutEof = rrdMetrics.replace(/\n# EOF$/, '')

  const allMetricsSections = [poolMetrics.join('\n')]
  if (rrdMetricsWithoutEof !== '') allMetricsSections.push(rrdMetricsWithoutEof)
  if (srMetricsOutput !== '') allMetricsSections.push(srMetricsOutput)
  if (vdiMetricsOutput !== '') allMetricsSections.push(vdiMetricsOutput)
  if (hostStatusOutput !== '') allMetricsSections.push(hostStatusOutput)
  if (uptimeMetricsOutput !== '') allMetricsSections.push(uptimeMetricsOutput)
  if (vmStatusOutput !== '') allMetricsSections.push(vmStatusOutput)
  if (vmUptimeOutput !== '') allMetricsSections.push(vmUptimeOutput)
  if (xoMetricsOutput !== '') allMetricsSections.push(xoMetricsOutput)
  if (xostorMetricsOutput !== '') allMetricsSections.push(xostorMetricsOutput)
  if (xostorAlarmsOutput !== '') allMetricsSections.push(xostorAlarmsOutput)
  if (xostorSmartOutput !== '') allMetricsSections.push(xostorSmartOutput)
  if (xostorUpdatesOutput !== '') allMetricsSections.push(xostorUpdatesOutput)

  return allMetricsSections.join('\n') + '\n# EOF'
}

// ============================================================================
// Fixtures
// ============================================================================

const zeroXoMetrics = (): XoMetricsData => ({
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
})

// Two hosts in the SAME pool → exercises pool deduplication.
const twoHostCredentials = (): LabelContext => ({
  hosts: [
    {
      hostId: 'host-1',
      hostAddress: '192.168.1.1',
      hostLabel: 'Host 1',
      poolId: 'pool-1',
      poolLabel: 'Prod Pool',
      sessionId: 'session-1',
      protocol: 'https:',
    },
    {
      hostId: 'host-2',
      hostAddress: '192.168.1.2',
      hostLabel: 'Host 2',
      poolId: 'pool-1',
      poolLabel: 'Prod Pool',
      sessionId: 'session-2',
      protocol: 'https:',
    },
  ],
  labels: {
    vms: {},
    hosts: {
      'host-1': { name_label: 'Host 1', pifDeviceToNetworkName: {}, startTime: null },
      'host-2': { name_label: 'Host 2', pifDeviceToNetworkName: {}, startTime: null },
    },
    srs: {},
    srTruncatedToUuid: {},
    vdiUuidToSrUuid: {},
  },
})

const emptyInput = (credentials: LabelContext, rrdDataList: ParsedRrdData[] = []): CollectInput => ({
  credentials,
  srData: { srs: [] },
  vdiData: { vdis: [] },
  hostStatusData: { hosts: [] },
  vmStatusData: { vms: [] },
  xoMetricsData: zeroXoMetrics(),
  xostorData: { clusters: [] },
  xostorAlarms: { clusters: [] },
  xostorSmart: { hosts: [] },
  xostorUpdates: { hosts: [] },
  rrdDataList,
})

const sampleRrd = (): ParsedRrdData[] => [
  {
    poolId: 'pool-1',
    timestamp: 1700000000,
    metrics: [
      {
        legend: {
          cf: 'AVERAGE',
          objectType: 'host',
          uuid: 'host-1',
          metricName: 'cpu_avg',
          rawLegend: 'AVERAGE:host:host-1:cpu_avg',
        },
        value: 0.5,
        timestamp: 1700000000,
      },
    ],
  },
]

const sampleHostStatus = (): HostStatusItem[] => [
  {
    uuid: 'host-1',
    name_label: 'Host 1',
    power_state: 'Running',
    enabled: true,
    pool_id: 'pool-1',
    pool_name: 'Prod Pool',
  },
  {
    uuid: 'host-2',
    name_label: 'Host 2',
    power_state: 'Halted',
    enabled: true,
    pool_id: 'pool-1',
    pool_name: 'Prod Pool',
  },
]

// ============================================================================
// Tests
// ============================================================================

describe('collectMetrics assembly contract', () => {
  it('short-circuits to "# No connected hosts" when there are no hosts', () => {
    const input = emptyInput({
      hosts: [],
      labels: { vms: {}, hosts: {}, srs: {}, srTruncatedToUuid: {}, vdiUuidToSrUuid: {} },
    })
    assert.equal(assembleMetrics(input), '# No connected hosts\n# EOF')
  })

  it('always starts with the pool_connected HELP/TYPE block and ends with # EOF', () => {
    const output = assembleMetrics(emptyInput(twoHostCredentials()))
    assert.ok(output.startsWith('# HELP xcp_pool_connected'), 'starts with pool HELP')
    assert.ok(output.includes('\n# TYPE xcp_pool_connected gauge\n'), 'has pool TYPE line')
    assert.ok(output.endsWith('\n# EOF'), 'ends with EOF marker')
    assert.ok(!output.includes('# No connected hosts'))
  })

  it('deduplicates pools: one xcp_pool_connected line for two hosts in the same pool', () => {
    const output = assembleMetrics(emptyInput(twoHostCredentials()))
    const matches = output.match(/^xcp_pool_connected\{/gm) ?? []
    assert.equal(matches.length, 1)
    assert.ok(output.includes('xcp_pool_connected{pool_id="pool-1",pool_name="Prod Pool"} 1'))
  })

  it('skips empty sections: only pool block + EOF when no other data', () => {
    const output = assembleMetrics(emptyInput(twoHostCredentials()))
    // No RRD, SR, VDI, status, uptime, or xostor sections present.
    assert.ok(!output.includes('xcp_host_status'))
    assert.ok(!output.includes('xcp_sr_'))
    assert.ok(!output.includes('xcp_vdi_'))
    assert.ok(!output.includes('xcp_xostor'))
  })

  it('emits present sections in the canonical order: pool → RRD → host status → XO', () => {
    const input = emptyInput(twoHostCredentials(), sampleRrd())
    input.hostStatusData = { hosts: sampleHostStatus() }
    const output = assembleMetrics(input)

    const iPool = output.indexOf('# HELP xcp_pool_connected')
    const iHostStatus = output.indexOf('xcp_host_status')
    const iXo = output.indexOf('xo_') // XO management-plane metrics use the `xo` prefix
    const iEof = output.indexOf('# EOF')

    assert.ok(iPool >= 0 && iHostStatus >= 0 && iXo >= 0, 'expected sections present')
    assert.ok(iPool < iHostStatus, 'pool before host status')
    assert.ok(iHostStatus < iXo, 'host status before XO metrics')
    assert.ok(iXo < iEof, 'XO metrics before EOF')
    assert.equal(output.lastIndexOf('# EOF'), output.length - '# EOF'.length, 'single trailing EOF')
  })

  it('strips the inner # EOF from the RRD section and keeps a single trailing EOF', () => {
    const output = assembleMetrics(emptyInput(twoHostCredentials(), sampleRrd()))
    const eofCount = (output.match(/^# EOF$/gm) ?? []).length
    assert.equal(eofCount, 1, 'exactly one # EOF in the whole document')
  })
})
