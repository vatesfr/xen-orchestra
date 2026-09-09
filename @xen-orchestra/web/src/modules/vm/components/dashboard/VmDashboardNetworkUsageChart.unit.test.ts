import VmDashboardNetworkUsageChart from '@/modules/vm/components/dashboard/VmDashboardNetworkUsageChart.vue'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue, VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import type { XapiVmStats } from '@vates/types/common'
import { mount } from '@vue/test-utils'

function mountChart(props: { data: XapiVmStats | null; loading?: boolean; error?: boolean }) {
  return mount(VmDashboardNetworkUsageChart, {
    props: { loading: false, ...props },
    global: { ...createGlobalTestConfig(), stubs: { VtsLinearChart: VtsLinearChartStub } },
  })
}

const statsWithSamples = createVmStats({ stats: { vifs: { rx: { '0': [10, 20] }, tx: { '0': [30, 40] } } } })

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('network-throughput'))
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

it('reports that there is nothing to plot when the VM has no vif sample', () => {
  const wrapper = mountChart({ data: createVmStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot for null stats', () => {
  const wrapper = mountChart({ data: null })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('plots the upload above the download', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('network-upload'),
      data: [
        { timestamp: 990_000, value: 30 },
        { timestamp: 1_000_000, value: 40 },
      ],
    },
    {
      label: t('network-download'),
      data: [
        { timestamp: 990_000, value: 10 },
        { timestamp: 1_000_000, value: 20 },
      ],
    },
  ])
})

it('sums the throughput of every vif of the VM', () => {
  const wrapper = mountChart({
    data: createVmStats({ stats: { vifs: { rx: { '0': [10, 20], '1': [1, 2] }, tx: { '0': [30, 40] } } } }),
  })

  expect(findLinearChart(wrapper).props('data')[1].data).toEqual([
    { timestamp: 990_000, value: 11 },
    { timestamp: 1_000_000, value: 22 },
  ])
})

it('rounds the axis up to the next hundred bytes, with headroom above the peak', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(100)
})

it('plots a flat download for a VM reporting transmissions but no reception', () => {
  const wrapper = mountChart({ data: createVmStats({ stats: { vifs: { rx: {}, tx: { '0': [30, 40] } } } }) })

  expect(findLinearChart(wrapper).props('data')[1].data).toEqual([
    { timestamp: 990_000, value: 0 },
    { timestamp: 1_000_000, value: 0 },
  ])
})

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 1024)).toBe('1 KiB')
})
