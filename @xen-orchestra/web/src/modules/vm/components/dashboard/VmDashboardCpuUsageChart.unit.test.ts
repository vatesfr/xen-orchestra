import VmDashboardCpuUsageChart from '@/modules/vm/components/dashboard/VmDashboardCpuUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats>) {
  return mountChartCard(VmDashboardCpuUsageChart, props)
}

const statsWithSamples = createVmStats({ stats: { cpus: { cpu0: [10, 20] } } })

itShowsChartCard(mountChart, {
  title: t('cpu-usage'),
  stats: statsWithSamples,
  nullStats: 'nothing-to-plot',
  nothingToPlot: {
    'when the VM has no vcpu sample': createVmStats(),
  },
  formatsAs: 'percentages',
})

it('plots the average usage across the vcpus of the VM', () => {
  const wrapper = mountChart({ data: createVmStats({ stats: { cpus: { cpu0: [10, 20], cpu1: [30, 40] } } }) })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-cpu-usage'),
      data: [
        { timestamp: 990_000, value: 20 },
        { timestamp: 1_000_000, value: 30 },
      ],
    },
  ])
})

it('rounds the axis up to the next hundred percent', () => {
  const wrapper = mountChart({ data: createVmStats({ stats: { cpus: { cpu0: [10, 120] } } }) })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(200)
})
