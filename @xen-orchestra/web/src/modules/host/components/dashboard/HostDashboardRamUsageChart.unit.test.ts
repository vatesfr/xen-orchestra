import HostDashboardRamUsageChart from '@/modules/host/components/dashboard/HostDashboardRamUsageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiHostStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardRamUsageChart, props)
}

const statsWithSamples = createHostStats({
  stats: { memory: [2048, 4096], memoryFree: [1024, 2048] },
})

itShowsChartCard(mountChart, {
  title: t('ram-usage'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    'when the host has no memory sample': createHostStats(),
    'when the free memory is missing': createHostStats({ stats: { memory: [2048, 4096] } }),
  },
  formatsAs: 'bytes',
})

it('plots the memory the host actually uses', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-ram-usage'),
      data: [
        { timestamp: 990_000, value: 1024 },
        { timestamp: 1_000_000, value: 2048 },
      ],
    },
  ])
})

it('scales the axis to the total memory of the host', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(4096)
})
