import HostDashboardRamUsageChart from '@/modules/host/components/dashboard/HostDashboardRamUsageChart.vue'
import { createHostStats } from '@/test/create-host-stats.ts'
import { findCardTitle } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import { findLinearChart, formatChartValue } from '@/test/linear-chart-stub.ts'
import { mountChartCard, type ChartCardProps } from '@/test/mount-chart-card.ts'
import { hasLoader } from '@core-test/expect-loader.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import type { XapiHostStats } from '@vates/types/common'

function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardRamUsageChart, props)
}

const statsWithSamples = createHostStats({
  stats: { memory: [2048, 4096], memoryFree: [1024, 2048] },
})

it('renders the card title and the period it covers', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findCardTitle(wrapper)).toContain(t('ram-usage'))
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

it('reports that there is nothing to plot when the host has no memory sample', () => {
  const wrapper = mountChart({ data: createHostStats() })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-data-to-calculate')])
})

it('reports that there is nothing to plot when the free memory is missing', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { memory: [2048, 4096] } }) })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-data-to-calculate')])
})

it('plots the memory the host actually uses', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('stacked-ram-usage'),
      data: [
        { timestamp: 990_000, value: 1024 },
        { timestamp: 1_000_000, value: 2048 },
      ],
    },
  ])
})

it('scales the axis to the total memory of the host', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(findLinearChart(wrapper).props('maxValue')).toBe(4096)
})

it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 1024)).toBe('1 KiB')
})
