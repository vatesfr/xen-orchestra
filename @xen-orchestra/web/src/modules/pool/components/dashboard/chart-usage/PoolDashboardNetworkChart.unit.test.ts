import PoolDashboardNetworkChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardNetworkChart.vue'
import { createPoolStats } from '@/test/create-pool-stats.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import { hasLoader } from '@core-test/expect-loader.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import type { XapiPoolStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiPoolStats>) {
  return mountChartCard(PoolDashboardNetworkChart, props)
}

const statsWithSamples = createPoolStats({
  'host-1': { stats: { pifs: { rx: { eth0: [10, 20] }, tx: { eth0: [30, 40] } } } },
})

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findCardTitle(wrapper)).toContain(t('network-throughput'))
  expect(findCardTitle(wrapper)).toContain(t('last-week'))
})

it('shows a loader while the stats are loading', () => {
  const wrapper = mountChart({ data: null, loading: true })

  expect(hasLoader(wrapper)).toBe(true)
})

it('shows a loader while the stats have not arrived yet', () => {
  const wrapper = mountChart({ data: null })

  expect(hasLoader(wrapper)).toBe(true)
})

it('shows an error message when the stats could not be fetched', () => {
  const wrapper = mountChart({ data: statsWithSamples, error: true })

  expect(findStateHeroTexts(wrapper)).toEqual([t('error-no-data')])
})

it('reports that there is nothing to plot for a pool without host', () => {
  const wrapper = mountChart({ data: createPoolStats() })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-data-to-calculate')])
})

it('reports that there is nothing to plot when no host reports its pifs', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { memory: [2048, 4096] } } }) })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-data-to-calculate')])
})

it('reports that there is nothing to plot when the pifs of every host hold no sample', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { pifs: { rx: {}, tx: {} } } } }) })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-data-to-calculate')])
})

it('reports that there is nothing to plot when the stats of every host failed', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { error: { code: 'boom' } } }) })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-data-to-calculate')])
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

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 1024)).toBe('1 KiB')
})
