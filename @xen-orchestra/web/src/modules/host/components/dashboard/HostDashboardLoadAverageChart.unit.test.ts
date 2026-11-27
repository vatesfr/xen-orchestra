import HostDashboardLoadAverageChart from '@/modules/host/components/dashboard/HostDashboardLoadAverageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiHostStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardLoadAverageChart, props)
}

const statsWithSamples = createHostStats({ stats: { load: [1.5, 2.5] } })

itShowsChartCard(mountChart, {
  title: t('load-average'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    'when the host has no load sample': createHostStats(),
  },
})

it('plots the load average of the host', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { load: [1.234, 2.567] } }) })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('load-average'),
      data: [
        { timestamp: 990_000, value: 1.23 },
        { timestamp: 1_000_000, value: 2.57 },
      ],
    },
  ])
})

it('rounds the axis up to the next multiple of five', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { load: [1.5, 6.5] } }) })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(10)
})

it('falls back to a maximum of ten when every sample is zero', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { load: [0, 0] } }) })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(10)
})
