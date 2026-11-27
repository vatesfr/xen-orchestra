import VmDashboardNetworkUsageChart from '@/modules/vm/components/dashboard/VmDashboardNetworkUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats>) {
  return mountChartCard(VmDashboardNetworkUsageChart, props)
}

const statsWithSamples = createVmStats({ stats: { vifs: { rx: { '0': [10, 20] }, tx: { '0': [30, 40] } } } })

itShowsChartCard(mountChart, {
  title: t('network-throughput'),
  stats: statsWithSamples,
  nullStats: 'nothing-to-plot',
  nothingToPlot: {
    'when the VM has no vif sample': createVmStats(),
  },
  formatsAs: 'bytes',
})

it('plots the upload above the download', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('network-upload'),
      data: [
        { timestamp: 990_000, value: 30 },
        { timestamp: 1_000_000, value: 40 },
      ],
    },
    {
      label: t('network-download'),
      data: [
        { timestamp: 990_000, value: 10 },
        { timestamp: 1_000_000, value: 20 },
      ],
    },
  ])
})

it('sums the throughput of every vif of the VM', () => {
  const wrapper = mountChart({
    data: createVmStats({ stats: { vifs: { rx: { '0': [10, 20], '1': [1, 2] }, tx: { '0': [30, 40] } } } }),
  })

  expect(findLinearChart(wrapper).props('data')[1].data).toEqual([
    { timestamp: 990_000, value: 11 },
    { timestamp: 1_000_000, value: 22 },
  ])
})

it('rounds the axis up to the next hundred bytes, with headroom above the peak', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(100)
})

it('plots a flat download for a VM reporting transmissions but no reception', () => {
  const wrapper = mountChart({ data: createVmStats({ stats: { vifs: { rx: {}, tx: { '0': [30, 40] } } } }) })

  expect(findLinearChart(wrapper).props('data')[1].data).toEqual([
    { timestamp: 990_000, value: 0 },
    { timestamp: 1_000_000, value: 0 },
  ])
})
