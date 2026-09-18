import SiteDashboardPatches from '@/modules/site/components/dashboard/SiteDashboardPatches.vue'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { findCardHeading } from '@/test/find-card-heading.ts'
import { findLegendSections } from '@/test/find-labelled-values.ts'
import { t } from '@/test/i18n.ts'

// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})

const mountPatches = (overrides?: Partial<XoDashboard>) => siteDashboard.mountCard(SiteDashboardPatches, overrides)

it('names the card', () => {
  const wrapper = mountPatches()

  expect(findCardHeading(wrapper)).toEqual({ title: t('patches') })
})

it('shows a loader while the missing patches have not arrived', () => {
  const wrapper = mountPatches({ missingPatches: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegendSections(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountPatches()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
  expect(findLegendSections(wrapper)).toEqual([])
})

it('breaks down the pools and the hosts between up to date and missing patches', () => {
  const wrapper = mountPatches()

  expect(findLegendSections(wrapper)).toEqual([
    [
      t('pools'),
      [
        [t('up-to-date'), '6'],
        [t('missing-patches'), '4'],
      ],
    ],
    [
      t('hosts'),
      [
        [t('up-to-date'), '12'],
        [t('missing-patches'), '8'],
        [t('eol'), '3'],
      ],
    ],
  ])
})

it('leaves the end-of-life hosts out when the site does not count them', () => {
  const wrapper = mountPatches({
    missingPatches: {
      hasAuthorization: true,
      nPools: 10,
      nPoolsWithMissingPatches: 4,
      nHosts: 20,
      nHostsWithMissingPatches: 8,
      nHostsEol: { isEmpty: true },
      nHostsFailed: 1,
    },
  })

  expect(findLegendSections(wrapper)[1]).toEqual([
    t('hosts'),
    [
      [t('up-to-date'), '12'],
      [t('missing-patches'), '8'],
    ],
  ])
})

// The card reaches neither its error hero nor a message here — see the report on
// `hasError`, whose last line is unreachable.
it('leaves both breakdowns empty when the user may not see the missing patches', () => {
  const wrapper = mountPatches({ missingPatches: { hasAuthorization: false } })

  expect(findLegendSections(wrapper)).toEqual([
    [t('pools'), []],
    [t('hosts'), []],
  ])
})

it('leaves both breakdowns empty when the missing patches could not be counted', () => {
  const wrapper = mountPatches({ missingPatches: { error: true } })

  expect(findLegendSections(wrapper)).toEqual([
    [t('pools'), []],
    [t('hosts'), []],
  ])
})
