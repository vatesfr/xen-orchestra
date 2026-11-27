import HostDashboardCpuUsageChart from '@/modules/host/components/dashboard/HostDashboardCpuUsageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiHostStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardCpuUsageChart, props)
}

const statsWithSamples = createHostStats({ stats: { cpus: { '0': [10, 20] } } })

itShowsChartCard(mountChart, {
  title: t('cpu-usage'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    'when the host has no cpu sample': createHostStats(),
    'when the host reports no cpu at all': createHostStats({ stats: { cpus: {} } }),
  },
  formatsAs: 'percentages',
})

it('plots the average usage across the vcpus of the host', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { cpus: { '0': [10, 20], '1': [30, 40] } } }) })

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
  const wrapper = mountChart({ data: createHostStats({ stats: { cpus: { '0': [10, 120] } } }) })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(200)
})
