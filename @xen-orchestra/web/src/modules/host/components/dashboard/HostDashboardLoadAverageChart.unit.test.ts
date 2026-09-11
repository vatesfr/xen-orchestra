import HostDashboardLoadAverageChart from '@/modules/host/components/dashboard/HostDashboardLoadAverageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiHostStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardLoadAverageChart, props)
}

const statsWithSamples = createHostStats({ stats: { load: [1.5, 2.5] } })

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('load-average'))
  expect(wrapper.get('.ui-card-title').text()).toContain(t('last-week'))
})

it('shows a loader while the stats are loading', () => {
  const wrapper = mountChart({ data: null, loading: true })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows a loader while the stats have not arrived yet', () => {
  const wrapper = mountChart({ data: null })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the stats could not be fetched', () => {
  const wrapper = mountChart({ data: statsWithSamples, error: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('reports that there is nothing to plot when the host has no load sample', () => {
  const wrapper = mountChart({ data: createHostStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
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
