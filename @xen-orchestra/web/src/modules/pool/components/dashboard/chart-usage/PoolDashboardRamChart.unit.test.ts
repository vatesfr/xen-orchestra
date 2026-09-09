import PoolDashboardRamChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardRamChart.vue'
import { createPoolStats } from '@/test/create-pool-stats.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue, VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import type { XapiPoolStats } from '@vates/types/common'
import { mount } from '@vue/test-utils'

function mountChart(props: { data: XapiPoolStats | null; loading?: boolean; error?: boolean }) {
  return mount(PoolDashboardRamChart, {
    props: { loading: false, ...props },
    global: { ...createGlobalTestConfig(), stubs: { VtsLinearChart: VtsLinearChartStub } },
  })
}

const statsWithSamples = createPoolStats({
  'host-1': { stats: { memory: [2048, 4096], memoryFree: [1024, 2048] } },
})

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('pool-ram-usage'))
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

it('reports that there is nothing to plot when the free memory of every host is missing', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { memory: [2048, 4096] } } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot when the memory of every host holds no sample', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { memory: [], memoryFree: [] } } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('reports that there is nothing to plot when the stats of every host failed', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { error: { code: 'boom' } } }) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('plots the memory used, stacked across every host of the pool', () => {
  const wrapper = mountChart({
    data: createPoolStats({
      'host-1': { stats: { memory: [2048, 4096], memoryFree: [1024, 2048] } },
      'host-2': { stats: { memory: [1024, 1024], memoryFree: [512, 256] } },
    }),
  })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-ram-usage'),
      data: [
        { timestamp: 990_000, value: 1536 },
        { timestamp: 1_000_000, value: 2816 },
      ],
    },
  ])
})

it('scales the axis to the total memory of the pool', () => {
  const wrapper = mountChart({
    data: createPoolStats({
      'host-1': { stats: { memory: [2048, 4096], memoryFree: [1024, 2048] } },
      'host-2': { stats: { memory: [1024, 1024], memoryFree: [512, 256] } },
    }),
  })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(5120)
})

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 1024)).toBe('1 KiB')
})
