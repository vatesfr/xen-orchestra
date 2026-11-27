import PoolDashboardCpuChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardCpuChart.vue'
import { createPoolStats, POOL_STATS_WITH_MEMORY_ONLY, POOL_STATS_WITHOUT_SAMPLES } from '@/test/create-pool-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiPoolStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiPoolStats>) {
  return mountChartCard(PoolDashboardCpuChart, props)
}

const statsWithSamples = createPoolStats({
  'host-1': { stats: { cpus: { '0': [10, 20] }, memory: [2048, 4096] } },
})

itShowsChartCard(mountChart, {
  title: t('pool-cpu-usage'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    ...POOL_STATS_WITHOUT_SAMPLES,
    'when no host reports its cpus': POOL_STATS_WITH_MEMORY_ONLY,
    'when the cpus of every host hold no sample': createPoolStats({ 'host-1': { stats: { cpus: { '0': [] } } } }),
  },
  formatsAs: 'percentages',
})

it('plots the usage stacked across every host of the pool', () => {
  const wrapper = mountChart({
    data: createPoolStats({
      'host-1': { stats: { cpus: { '0': [10, 20] } } },
      'host-2': { stats: { cpus: { '0': [1, 2], '1': [3, 4] } } },
    }),
  })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-cpu-usage'),
      data: [
        { timestamp: 990_000, value: 14 },
        { timestamp: 1_000_000, value: 26 },
      ],
    },
  ])
})

it('scales the axis above the peak of the stacked usage', () => {
  const wrapper = mountChart({ data: createPoolStats({ 'host-1': { stats: { cpus: { '0': [10, 90] } } } }) })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(200)
})
