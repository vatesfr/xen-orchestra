import PoolDashboardRamChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardRamChart.vue'
import { createPoolStats, POOL_STATS_WITH_MEMORY_ONLY, POOL_STATS_WITHOUT_SAMPLES } from '@/test/create-pool-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiPoolStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiPoolStats>) {
  return mountChartCard(PoolDashboardRamChart, props)
}

const statsWithSamples = createPoolStats({
  'host-1': { stats: { memory: [2048, 4096], memoryFree: [1024, 2048] } },
})

itShowsChartCard(mountChart, {
  title: t('pool-ram-usage'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    ...POOL_STATS_WITHOUT_SAMPLES,
    'when the free memory of every host is missing': POOL_STATS_WITH_MEMORY_ONLY,
    'when the memory of every host holds no sample': createPoolStats({
      'host-1': { stats: { memory: [], memoryFree: [] } },
    }),
  },
  formatsAs: 'bytes',
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
