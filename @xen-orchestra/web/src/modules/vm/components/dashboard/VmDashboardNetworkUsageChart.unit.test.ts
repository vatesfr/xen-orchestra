import VmDashboardNetworkUsageChart from '@/modules/vm/components/dashboard/VmDashboardNetworkUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { XapiVmStats } from '@vates/types/common'
import { mount } from '@vue/test-utils'

function mountChart(props: { data: XapiVmStats | null; loading?: boolean; error?: boolean }) {
  return mount(VmDashboardNetworkUsageChart, {
    props: { loading: false, ...props },
    global: createGlobalTestConfig(),
  })
}

const statsWithSamples = createVmStats({ stats: { vifs: { rx: { '0': [10, 20] }, tx: { '0': [30, 40] } } } })

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain('Network throughput')
  expect(wrapper.get('.ui-card-title').text()).toContain('Last week')
})

it('shows a loader while the stats are loading', () => {
  const wrapper = mountChart({ data: null, loading: true })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the stats could not be fetched', () => {
  const wrapper = mountChart({ data: null, error: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe("Error, can't collect data.")
})

it('prefers the error message over the missing stats', () => {
  const wrapper = mountChart({ data: statsWithSamples, error: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe("Error, can't collect data.")
})

it('reports that there is nothing to plot when the VM has no vif sample', () => {
  const wrapper = mountChart({ data: createVmStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe('No data to calculate')
})

it('reports that there is nothing to plot for null stats', () => {
  const wrapper = mountChart({ data: null })

  expect(wrapper.get('.vts-state-hero').text()).toBe('No data to calculate')
})

it('plots the chart once the stats hold samples', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.find('.vts-state-hero').exists()).toBe(false)
})
