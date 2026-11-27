import HostDashboardNetworkUsageChart from '@/modules/host/components/dashboard/HostDashboardNetworkUsageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart } from '@/test/linear-chart-stub.ts'
import { itShowsChartCard, mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import type { XapiHostStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardNetworkUsageChart, props)
}

const statsWithSamples = createHostStats({
  stats: { pifs: { rx: { eth0: [10, 20] }, tx: { eth0: [30, 40] } } },
})

itShowsChartCard(mountChart, {
  title: t('network-throughput'),
  stats: statsWithSamples,
  nullStats: 'loader',
  nothingToPlot: {
    'when the host has no pif sample': createHostStats(),
  },
  formatsAs: 'bytes',
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

it('sums the throughput of every pif of the host', () => {
  const wrapper = mountChart({
    data: createHostStats({ stats: { pifs: { rx: { eth0: [10, 20], eth1: [1, 2] }, tx: { eth0: [30, 40] } } } }),
  })

  expect(findLinearChart(wrapper).props('data')[1].data).toEqual([
    { timestamp: 990_000, value: 11 },
    { timestamp: 1_000_000, value: 22 },
  ])
})

it('rounds the axis up to the next fifty bytes, with headroom above the peak', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(50)
})

it('plots a flat download for a host reporting transmissions but no reception', () => {
  const wrapper = mountChart({
    data: createHostStats({ stats: { pifs: { rx: {}, tx: { eth0: [30, 40] } } } }),
  })

  expect(findLinearChart(wrapper).props('data')[1].data).toEqual([
    { timestamp: 990_000, value: 0 },
    { timestamp: 1_000_000, value: 0 },
  ])
})
