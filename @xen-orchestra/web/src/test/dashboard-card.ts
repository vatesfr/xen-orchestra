import { findCardTitle } from '@/test/find-card-title.ts'
import { t } from '@/test/i18n.ts'
import { expectLoaderInsteadOf } from '@core-test/expect-loader.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import type { VueWrapper } from '@vue/test-utils'

// The whole card title, or the parts a title holding more (a count, a top five) must contain
export type CardTitle = string | string[]

/**
 * Registers the title test of a dashboard card, on the card the mount helper renders by default.
 */
export function itRendersCardTitle(mountCard: () => VueWrapper, title: CardTitle) {
  it('renders the card title', () => {
    const cardTitle = findCardTitle(mountCard())

    if (typeof title === 'string') {
      expect(cardTitle).toBe(title)
    } else {
      title.forEach(part => expect(cardTitle).toContain(part))
    }
  })
}

// The props of a dashboard card: its dashboard, under the prop named `TProp`, and whether it could not be fetched
export type DashboardCardProps<TProp extends string, TDashboard> = Partial<Record<TProp, TDashboard>> & {
  hasError?: boolean
}

type DashboardCardStatesCase<TProp extends string, TDashboard> = {
  // The name of the prop the card takes its dashboard from (`poolDashboard`, `vmDashboard`)
  dashboardProp: TProp
  title: CardTitle
  // Each dashboard still missing what the card reads, keyed by what is missing, in the test name
  missing: Record<string, TDashboard>
  // Reads the content the loader stands in for, empty while the dashboard has not arrived
  findContent: (wrapper: VueWrapper) => unknown[]
  // Whether the card renders an error message of its own when the dashboard could not be fetched
  hasErrorState: boolean
}

/**
 * Registers the tests every card of an object dashboard shares (the component taking its dashboard and `hasError`):
 * its title, a loader while the dashboard or the part the card reads has not arrived, an error message when the
 * dashboard could not be fetched. The mount helper renders, by default, a dashboard the card can show.
 */
export function itShowsDashboardCardStates<TProp extends string, TDashboard>(
  mountCard: (props?: DashboardCardProps<TProp, TDashboard>) => VueWrapper,
  { dashboardProp, title, missing, findContent, hasErrorState }: DashboardCardStatesCase<TProp, TDashboard>
) {
  const withDashboard = (dashboard: TDashboard | undefined) =>
    ({ [dashboardProp]: dashboard }) as DashboardCardProps<TProp, TDashboard>

  itRendersCardTitle(mountCard, title)

  const loadingCases: [string, TDashboard | undefined][] = [
    ['the dashboard has not arrived yet', undefined],
    ...Object.entries(missing).map(([what, dashboard]): [string, TDashboard] => [
      `${what} is missing from the dashboard`,
      dashboard,
    ]),
  ]

  it.each(loadingCases)('shows a loader while %s', (_, dashboard) => {
    expectLoaderInsteadOf(mountCard(withDashboard(dashboard)), findContent)
  })

  if (!hasErrorState) {
    return
  }

  it('shows an error message when the dashboard could not be fetched', () => {
    const wrapper = mountCard({ hasError: true } as DashboardCardProps<TProp, TDashboard>)

    expect(findStateHeroTexts(wrapper)).toEqual([t('error-no-data')])
  })
}
