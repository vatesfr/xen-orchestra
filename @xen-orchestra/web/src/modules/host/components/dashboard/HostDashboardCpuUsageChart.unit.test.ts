import HostDashboardCpuUsageChart from '@/modules/host/components/dashboard/HostDashboardCpuUsageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import type { XapiHostStats } from '@vates/types/common'
import { mount } from '@vue/test-utils'

function mountChart(props: { data: XapiHostStats | null; loading?: boolean; error?: boolean }) {
  return mount(HostDashboardCpuUsageChart, {
    props: { loading: false, ...props },
    global: { ...createGlobalTestConfig(), stubs: { VtsLinearChart: VtsLinearChartStub } },
  })
}

const statsWithSamples = createHostStats({ stats: { cpus: { '0': [10, 20] } } })

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('cpu-usage'))
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

it('reports that there is nothing to plot when the host has no cpu sample', () => {
  const wrapper = mountChart({ data: createHostStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot when the host reports no cpu at all', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { cpus: {} } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
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
