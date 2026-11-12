import ClusterDashboardRamUsageChart from '@/modules/kubernetes/components/dashboard/ClusterDashboardRamUsageChart.vue'
import { formatChartBytes } from '@/shared/utils/chart-stats.util.ts'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats[]> & { excludedNodeCount?: number }) {
  return mountChartCard(ClusterDashboardRamUsageChart, { excludedNodeCount: 0, ...props })
}

const statsWithSamples = [createVmStats({ stats: { memory: [100, 200], memoryFree: [40, 50] } })]

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('ram-usage'))
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

it('reports that there is nothing to plot when no VM reports its memory', () => {
  const wrapper = mountChart({ data: [createVmStats()] })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('tells how many nodes are left out of the chart', () => {
  const wrapper = mountChart({ data: statsWithSamples, excludedNodeCount: 1 })

  expect(wrapper.get('.ui-info').text()).toBe(t('n-nodes-excluded', 1))
})

it('plots the used memory stacked across every node VM', () => {
  const wrapper = mountChart({
    data: [...statsWithSamples, createVmStats({ stats: { memory: [10, 20], memoryFree: [5, 5] } })],
  })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-ram-usage'),
      data: [
        { timestamp: 990_000, value: 65 },
        { timestamp: 1_000_000, value: 165 },
      ],
    },
  ])
})

it('scales the axis to the total memory of the node VMs', () => {
  const wrapper = mountChart({
    data: [...statsWithSamples, createVmStats({ stats: { memory: [10, 20], memoryFree: [5, 5] } })],
  })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(220)
})

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 2048)).toBe(formatChartBytes(2048))
})
