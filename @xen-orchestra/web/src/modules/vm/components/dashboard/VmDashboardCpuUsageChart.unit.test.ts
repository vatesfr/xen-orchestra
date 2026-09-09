import VmDashboardCpuUsageChart from '@/modules/vm/components/dashboard/VmDashboardCpuUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { n, t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue, VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import type { XapiVmStats } from '@vates/types/common'
import { mount } from '@vue/test-utils'

function mountChart(props: { data: XapiVmStats | null; loading?: boolean; error?: boolean }) {
  return mount(VmDashboardCpuUsageChart, {
    props: { loading: false, ...props },
    global: { ...createGlobalTestConfig(), stubs: { VtsLinearChart: VtsLinearChartStub } },
  })
}

const statsWithSamples = createVmStats({ stats: { cpus: { cpu0: [10, 20] } } })

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('cpu-usage'))
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

it('reports that there is nothing to plot when the VM has no vcpu sample', () => {
  const wrapper = mountChart({ data: createVmStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot for null stats', () => {
  const wrapper = mountChart({ data: null })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
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

it('formats the plotted values as percentages', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 4200)).toBe(n(42, 'percent'))
})
