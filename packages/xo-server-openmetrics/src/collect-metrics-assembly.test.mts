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
 * Commit 7 extracted the pure tail of `collectMetrics()` (everything after the
 * I/O data-gathering) into the exported `assembleMetrics(data)` function in
 * server/collect-metrics.mts. This test imports that real export, so it now
 * exercises PRODUCTION code — any drift in section order, dedup, empty-section
 * skipping, the no-hosts short-circuit, or the trailing `# EOF` surfaces here.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { LabelContext } from './openmetric-formatter.mjs'

import type { HostStatusItem, XoMetricsData } from './index.mjs'

import type { ParsedRrdData } from './rrd-parser.mjs'

// Commit 7 extracted the pure tail of collectMetrics() into this exported
// function; the test now exercises that PRODUCTION code directly.
import { assembleMetrics, type CollectInput } from './server/collect-metrics.mjs'

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
