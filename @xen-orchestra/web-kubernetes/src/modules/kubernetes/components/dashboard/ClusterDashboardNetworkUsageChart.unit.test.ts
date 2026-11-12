import ClusterDashboardNetworkUsageChart from '@/modules/kubernetes/components/dashboard/ClusterDashboardNetworkUsageChart.vue'
import { formatChartBytes } from '@/shared/utils/chart-stats.util.ts'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats[]> & { excludedNodeCount?: number }) {
  return mountChartCard(ClusterDashboardNetworkUsageChart, { excludedNodeCount: 0, ...props })
}

const statsWithSamples = [createVmStats({ stats: { vifs: { rx: { '0': [10] }, tx: { '0': [1] } } } })]

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('network-throughput'))
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

it('reports that there is nothing to plot when no VM reports its VIFs', () => {
  const wrapper = mountChart({ data: [createVmStats()] })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('tells how many nodes are left out of the chart', () => {
  const wrapper = mountChart({ data: statsWithSamples, excludedNodeCount: 3 })

  expect(wrapper.get('.ui-info').text()).toBe(t('n-nodes-excluded', 3))
})

it('plots the upload and download stacked across every node VM', () => {
  const wrapper = mountChart({
    data: [...statsWithSamples, createVmStats({ stats: { vifs: { rx: { '0': [5] }, tx: { '0': [2] } } } })],
  })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    { label: t('network-upload'), data: [{ timestamp: 1_000_000, value: 3 }] },
    { label: t('network-download'), data: [{ timestamp: 1_000_000, value: 15 }] },
  ])
})

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 2048)).toBe(formatChartBytes(2048))
})
