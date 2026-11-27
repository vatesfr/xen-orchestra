import VmDashboardVdiUsageChart from '@/modules/vm/components/dashboard/VmDashboardVdiUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats>) {
  return mountChartCard(VmDashboardVdiUsageChart, props)
}

const statsWithSamples = createVmStats({ stats: { xvds: { r: { xvda: [10, 20] }, w: { xvda: [30, 40] } } } })

itShowsChartCard(mountChart, {
  title: t('vdi-throughput'),
  stats: statsWithSamples,
  nullStats: 'nothing-to-plot',
  nothingToPlot: {
    'when the VM has no disk sample': createVmStats(),
  },
  formatsAs: 'bytes',
})

it('plots the reads above the writes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('read'),
      data: [
        { timestamp: 990_000, value: 10 },
        { timestamp: 1_000_000, value: 20 },
      ],
    },
    {
      label: t('write'),
      data: [
        { timestamp: 990_000, value: 30 },
        { timestamp: 1_000_000, value: 40 },
      ],
    },
  ])
})

it('sums the throughput of every disk of the VM', () => {
  const wrapper = mountChart({
    data: createVmStats({ stats: { xvds: { r: { xvda: [10, 20], xvdb: [1, 2] }, w: { xvda: [30, 40] } } } }),
  })

  expect(findLinearChart(wrapper).props('data')[0].data).toEqual([
    { timestamp: 990_000, value: 11 },
    { timestamp: 1_000_000, value: 22 },
  ])
})

it('rounds the axis up to the next hundred bytes, with headroom above the peak', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(100)
})

it('plots a flat read for a VM reporting writes but no read', () => {
  const wrapper = mountChart({ data: createVmStats({ stats: { xvds: { w: { xvda: [10, 20] } } } }) })

  expect(findLinearChart(wrapper).props('data')[0].data).toEqual([
    { timestamp: 990_000, value: 0 },
    { timestamp: 1_000_000, value: 0 },
  ])
})
