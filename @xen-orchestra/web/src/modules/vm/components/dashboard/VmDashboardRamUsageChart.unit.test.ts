import VmDashboardRamUsageChart from '@/modules/vm/components/dashboard/VmDashboardRamUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiVmStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiVmStats>) {
  return mountChartCard(VmDashboardRamUsageChart, props)
}

const statsWithSamples = createVmStats({ stats: { memory: [1000, 2000], memoryFree: [400, 500] } })

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('ram-usage'))
  expect(wrapper.get('.ui-card-title').text()).toContain(t('last-week'))
})

it('shows a loader while the stats are loading', () => {
  const wrapper = mountChart({ data: null, loading: true })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the stats could not be fetched', () => {
  const wrapper = mountChart({ data: null, error: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('prefers the error message over the missing stats', () => {
  const wrapper = mountChart({ data: statsWithSamples, error: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('reports that there is nothing to plot when the VM has no memory sample', () => {
  const wrapper = mountChart({ data: createVmStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot for null stats', () => {
  const wrapper = mountChart({ data: null })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
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

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 1024)).toBe('1 KiB')
})
