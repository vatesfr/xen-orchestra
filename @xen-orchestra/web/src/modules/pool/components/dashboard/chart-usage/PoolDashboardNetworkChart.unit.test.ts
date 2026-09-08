import PoolDashboardNetworkChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardNetworkChart.vue'
import { createPoolStats } from '@/test/create-pool-stats.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import type { XapiPoolStats } from '@vates/types/common'
import { mount } from '@vue/test-utils'

function mountChart(props: { data: XapiPoolStats | null; loading?: boolean; error?: boolean }) {
  return mount(PoolDashboardNetworkChart, {
    props: { loading: false, ...props },
    global: { ...createGlobalTestConfig(), stubs: { VtsLinearChart: VtsLinearChartStub } },
  })
}

const statsWithSamples = createPoolStats({
  'host-1': { stats: { pifs: { rx: { eth0: [10, 20] }, tx: { eth0: [30, 40] } } } },
})

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('network-throughput'))
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

it('reports that there is nothing to plot for a pool without host', () => {
  const wrapper = mountChart({ data: createPoolStats() })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot when no host reports its pifs', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { memory: [2048, 4096] } } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot when the pifs of every host hold no sample', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { pifs: { rx: {}, tx: {} } } } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot when the stats of every host failed', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { error: { code: 'boom' } } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('plots the upload above the download, stacked across every host of the pool', () => {
  const wrapper = mountChart({
    data: createPoolStats({
      'host-1': { stats: { pifs: { rx: { eth0: [10, 20] }, tx: { eth0: [30, 40] } } } },
      'host-2': { stats: { pifs: { rx: { eth0: [1, 2] }, tx: { eth0: [3, 4] } } } },
    }),
  })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('network-upload'),
      data: [
        { timestamp: 990_000, value: 33 },
        { timestamp: 1_000_000, value: 44 },
      ],
    },
    {
      label: t('network-download'),
      data: [
        { timestamp: 990_000, value: 11 },
        { timestamp: 1_000_000, value: 22 },
      ],
    },
  ])
})

it('rounds the axis up to the next fifty bytes, with headroom above the peak', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(50)
})
