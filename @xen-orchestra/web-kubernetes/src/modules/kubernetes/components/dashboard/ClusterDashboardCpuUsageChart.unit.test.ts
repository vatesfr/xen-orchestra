import ClusterDashboardCpuUsageChart from '@/modules/kubernetes/components/dashboard/ClusterDashboardCpuUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { n, t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats[]> & { excludedNodeCount?: number }) {
  return mountChartCard(ClusterDashboardCpuUsageChart, { excludedNodeCount: 0, ...props })
}

const statsWithSamples = [createVmStats({ stats: { cpus: { '0': [10, 20] } } })]

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('cpu-usage'))
  expect(wrapper.get('.ui-card-title').text()).toContain(t('last-week'))
})

it('shows a loader while the stats are loading', () => {
  const wrapper = mountChart({ data: [], loading: true })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the stats could not be fetched', () => {
  const wrapper = mountChart({ data: [], error: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('reports that there is nothing to plot when no VM reports its cpus', () => {
  const wrapper = mountChart({ data: [createVmStats()] })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('tells how many nodes are left out of the chart', () => {
  const wrapper = mountChart({ data: statsWithSamples, excludedNodeCount: 2 })

  expect(wrapper.get('.ui-info').text()).toBe(t('n-nodes-excluded', 2))
})

it('does not warn when every node is in the chart', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.find('.ui-info').exists()).toBe(false)
})

it('plots the usage stacked across every node VM', () => {
  const wrapper = mountChart({
    data: [createVmStats({ stats: { cpus: { '0': [10, 20] } } }), createVmStats({ stats: { cpus: { '0': [1, 2] } } })],
  })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-cpu-usage'),
      data: [
        { timestamp: 990_000, value: 11 },
        { timestamp: 1_000_000, value: 22 },
      ],
    },
  ])
})

it('scales the axis above the peak of the stacked usage', () => {
  const wrapper = mountChart({ data: [createVmStats({ stats: { cpus: { '0': [10, 90] } } })] })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(200)
})

it('formats the plotted values as percentages', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 4200)).toBe(n(42, 'percent'))
})
