import VmDashboardRamUsageChart from '@/modules/vm/components/dashboard/VmDashboardRamUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats>) {
  return mountChartCard(VmDashboardRamUsageChart, props)
}

const statsWithSamples = createVmStats({ stats: { memory: [1000, 2000], memoryFree: [400, 500] } })

itShowsChartCard(mountChart, {
  title: t('ram-usage'),
  stats: statsWithSamples,
  nullStats: 'nothing-to-plot',
  nothingToPlot: {
    'when the VM has no memory sample': createVmStats(),
  },
  formatsAs: 'bytes',
})

it('plots the memory the VM actually uses', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-ram-usage'),
      data: [
        { timestamp: 990_000, value: 600 },
        { timestamp: 1_000_000, value: 1500 },
      ],
    },
  ])
})

it('scales the axis to the memory allocated to the VM', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(2000)
})
