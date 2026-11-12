import {
  buildClusterCpuUsageSeries,
  buildClusterNetworkUsageSeries,
  buildClusterRamUsageSeries,
  getClusterRamUsageMaxValue,
} from '@/modules/kubernetes/utils/kubernetes-cluster-stats.util.ts'
import { RAM_CHART_MAX_FALLBACK } from '@xen-orchestra/web/src/shared/utils/chart-stats.util.ts'
import { createVmStats } from '@xen-orchestra/web/src/test/create-vm-stats.ts'

describe('buildClusterCpuUsageSeries', () => {
  it('sums the usage of every vCPU of every VM at each sample', () => {
    const vmsStats = [
      createVmStats({ stats: { cpus: { '0': [10, 20], '1': [30, 40] } } }),
      createVmStats({ stats: { cpus: { '0': [1, 2] } } }),
    ]

    expect(buildClusterCpuUsageSeries(vmsStats)).toEqual([
      { timestamp: 990_000, value: 41 },
      { timestamp: 1_000_000, value: 62 },
    ])
  })

  it('aligns the VMs on their most recent sample when their history lengths differ', () => {
    const vmsStats = [
      createVmStats({ stats: { cpus: { '0': [5] } } }),
      createVmStats({ endTimestamp: 1000, stats: { cpus: { '0': [10, 20, 30] } } }),
    ]

    expect(buildClusterCpuUsageSeries(vmsStats)).toEqual([
      { timestamp: 980_000, value: 10 },
      { timestamp: 990_000, value: 20 },
      { timestamp: 1_000_000, value: 35 },
    ])
  })

  it('counts a missing sample as zero instead of blanking the whole sample', () => {
    const vmsStats = [
      createVmStats({ stats: { cpus: { '0': [10, null] } } }),
      createVmStats({ stats: { cpus: { '0': [1, 2] } } }),
    ]

    expect(buildClusterCpuUsageSeries(vmsStats)).toEqual([
      { timestamp: 990_000, value: 11 },
      { timestamp: 1_000_000, value: 2 },
    ])
  })

  it('leaves out the VMs not reporting their cpus', () => {
    const vmsStats = [createVmStats({ stats: { cpus: { '0': [10] } } }), createVmStats({ stats: { memory: [1] } })]

    expect(buildClusterCpuUsageSeries(vmsStats)).toEqual([{ timestamp: 1_000_000, value: 10 }])
  })

  it('returns an empty series when the cpus of every VM hold no sample', () => {
    expect(buildClusterCpuUsageSeries([createVmStats({ stats: { cpus: { '0': [] } } })])).toEqual([])
  })

  it('returns an empty series when there is no VM', () => {
    expect(buildClusterCpuUsageSeries([])).toEqual([])
  })
})

describe('buildClusterRamUsageSeries', () => {
  it('sums the used memory of every VM at each sample', () => {
    const vmsStats = [
      createVmStats({ stats: { memory: [100, 200], memoryFree: [40, 50] } }),
      createVmStats({ stats: { memory: [10, 20], memoryFree: [5, 5] } }),
    ]

    expect(buildClusterRamUsageSeries(vmsStats)).toEqual([
      { timestamp: 990_000, value: 65 },
      { timestamp: 1_000_000, value: 165 },
    ])
  })

  it('leaves out the VMs not reporting their free memory', () => {
    const vmsStats = [
      createVmStats({ stats: { memory: [100], memoryFree: [40] } }),
      createVmStats({ stats: { memory: [10] } }),
    ]

    expect(buildClusterRamUsageSeries(vmsStats)).toEqual([{ timestamp: 1_000_000, value: 60 }])
  })
})

describe('getClusterRamUsageMaxValue', () => {
  it('sums the peak memory of every VM', () => {
    const vmsStats = [createVmStats({ stats: { memory: [100, 200] } }), createVmStats({ stats: { memory: [50] } })]

    expect(getClusterRamUsageMaxValue(vmsStats)).toBe(250)
  })

  it('falls back to the default maximum when every memory sample is zero, which would flatten the axis', () => {
    expect(getClusterRamUsageMaxValue([createVmStats({ stats: { memory: [0, 0] } })])).toBe(RAM_CHART_MAX_FALLBACK)
  })

  it('falls back to the default maximum when no VM reports its memory', () => {
    expect(getClusterRamUsageMaxValue([createVmStats()])).toBe(RAM_CHART_MAX_FALLBACK)
  })
})

describe('buildClusterNetworkUsageSeries', () => {
  it('sums the received and transmitted throughput of every VIF of every VM', () => {
    const vmsStats = [
      createVmStats({ stats: { vifs: { rx: { '0': [10], '1': [20] }, tx: { '0': [1] } } } }),
      createVmStats({ stats: { vifs: { rx: { '0': [5] }, tx: { '0': [2] } } } }),
    ]

    expect(buildClusterNetworkUsageSeries(vmsStats)).toEqual([
      [{ timestamp: 1_000_000, value: 35 }],
      [{ timestamp: 1_000_000, value: 3 }],
    ])
  })

  it('takes the sample count from whichever direction reports the most', () => {
    const vmsStats = [createVmStats({ stats: { vifs: { rx: { '0': [10] }, tx: { '0': [1, 2] } } } })]

    expect(buildClusterNetworkUsageSeries(vmsStats)).toEqual([
      [
        { timestamp: 990_000, value: 10 },
        { timestamp: 1_000_000, value: 0 },
      ],
      [
        { timestamp: 990_000, value: 1 },
        { timestamp: 1_000_000, value: 2 },
      ],
    ])
  })

  it('returns empty series when no VM reports its VIFs', () => {
    expect(buildClusterNetworkUsageSeries([createVmStats()])).toEqual([[], []])
  })
})
