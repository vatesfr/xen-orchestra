import PoolDashboardNetworkChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardNetworkChart.vue'
import { createPoolStats, POOL_STATS_WITHOUT_SAMPLES } from '@/test/create-pool-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiPoolStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiPoolStats>) {
  return mountChartCard(PoolDashboardNetworkChart, props)
}

const statsWithSamples = createPoolStats({
  'host-1': { stats: { pifs: { rx: { eth0: [10, 20] }, tx: { eth0: [30, 40] } } } },
})

itShowsChartCard(mountChart, {
  title: t('network-throughput'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    ...POOL_STATS_WITHOUT_SAMPLES,
    'when no host reports its pifs': createPoolStats({ 'host-1': { stats: { memory: [2048, 4096] } } }),
    'when the pifs of every host hold no sample': createPoolStats({
      'host-1': { stats: { pifs: { rx: {}, tx: {} } } },
    }),
  },
  formatsAs: 'bytes',
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
