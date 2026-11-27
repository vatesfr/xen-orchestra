import { itRendersCardTitle } from '@/test/card-title.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { n, t } from '@/test/i18n.ts'
import { formatChartValue, VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import { hasLoader } from '@core-test/expect-loader.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'

export type ChartCardProps<TStats> = {
  data: TStats | null
  loading?: boolean
  error?: boolean
}

/**
 * Mounts a dashboard chart card with its `VtsLinearChart` stubbed, so the
 * plotted series stay readable through {@link findLinearChart} — see
 * [Chart cards](../../docs/tests/testing-components.md#chart-cards).
 *
 * `loading` defaults to `false`: a card left loading renders only its hero, and
 * every test but the loader ones wants the chart.
 *
 * Wrap it per card to bind the component and its stats type:
 * `const mountChart = (props: ChartCardProps<XapiHostStats>) => mountChartCard(HostDashboardRamUsageChart, props)`
 */
export function mountChartCard<TStats>(component: Component, props: ChartCardProps<TStats>) {
  return mount(component, {
    props: { loading: false, ...props },
    global: createGlobalTestConfig({ stubs: { VtsLinearChart: VtsLinearChartStub } }),
  })
}

type ChartCardCase<TStats> = {
  title: string
  // Stats the card can plot
  stats: TStats
  // What the card shows for `null` stats: a loader (host and pool cards) or that there is nothing to plot (VM cards)
  nullStats: 'loader' | 'nothing-to-plot'
  // Stats the card has nothing to plot from, keyed by what they lack, as the end of the test name
  nothingToPlot: Record<string, TStats>
  // The format of the values the card hands its chart, left out when it hands no formatter
  formatsAs?: 'bytes' | 'percentages'
}

// One representative value per format: the formatters have their own tests
const FORMATTED_VALUES = {
  bytes: { value: 1024, expected: () => '1 KiB' },
  percentages: { value: 4200, expected: () => n(42, 'percent') },
}

/**
 * Registers the tests every dashboard chart card shares: its title and the period it covers, a loader while the
 * stats are loading, an error message when they could not be fetched, what it shows for `null` stats, that there is
 * nothing to plot from stats without samples, and the format of the plotted values. `mountChart` is the card's
 * `mountChartCard` wrapper.
 */
export function itShowsChartCard<TStats>(
  mountChart: (props: ChartCardProps<TStats>) => VueWrapper,
  { title, stats, nullStats, nothingToPlot, formatsAs }: ChartCardCase<TStats>
) {
  itRendersCardTitle(() => mountChart({ data: stats }), [title, t('last-week')])

  it('shows a loader while the stats are loading', () => {
    expect(hasLoader(mountChart({ data: null, loading: true }))).toBe(true)
  })

  it('shows an error message when the stats could not be fetched', () => {
    expect(findStateHeroTexts(mountChart({ data: stats, error: true }))).toEqual([t('error-no-data')])
  })

  if (nullStats === 'loader') {
    it('shows a loader while the stats have not arrived yet', () => {
      expect(hasLoader(mountChart({ data: null }))).toBe(true)
    })
  } else {
    it('prefers the error message over null stats', () => {
      expect(findStateHeroTexts(mountChart({ data: null, error: true }))).toEqual([t('error-no-data')])
    })
  }

  const nothingToPlotCases: [string, TStats | null][] = [
    ...Object.entries(nothingToPlot),
    ...(nullStats === 'nothing-to-plot' ? [['for null stats', null] as [string, null]] : []),
  ]

  it.each(nothingToPlotCases)('reports that there is nothing to plot %s', (_, data) => {
    expect(findStateHeroTexts(mountChart({ data }))).toEqual([t('no-data-to-calculate')])
  })

  if (formatsAs === undefined) {
    return
  }

  it(`formats the plotted values as ${formatsAs}`, () => {
    const { value, expected } = FORMATTED_VALUES[formatsAs]

    expect(formatChartValue(mountChart({ data: stats }), value)).toBe(expected())
  })
}
