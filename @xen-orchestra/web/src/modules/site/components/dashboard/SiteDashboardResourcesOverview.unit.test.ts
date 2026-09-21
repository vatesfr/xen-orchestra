import SiteDashboardResourcesOverview from '@/modules/site/components/dashboard/SiteDashboardResourcesOverview.vue'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { findCardHeading } from '@/test/find-card-heading.ts'
import { findCardNumbers } from '@/test/find-labelled-values.ts'
import { isLoading } from '@/test/find-loader.ts'
import { findStateHeroText } from '@/test/find-state-hero.ts'
import { t } from '@/test/i18n.ts'

// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})

const mountResourcesOverview = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardResourcesOverview, overrides)

it('names the card', () => {
  const wrapper = mountResourcesOverview()

  expect(findCardHeading(wrapper)).toEqual({ title: t('resources-overview') })
})

it('shows a loader while the overview has not arrived', () => {
  const wrapper = mountResourcesOverview({ resourcesOverview: undefined })

  expect(isLoading(wrapper)).toBe(true)
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('reports that there is nothing to compute when the site holds no resource', () => {
  const wrapper = mountResourcesOverview({ resourcesOverview: { isEmpty: true } })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountResourcesOverview()

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('reports that there is nothing to compute rather than an error when both are true', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountResourcesOverview({ resourcesOverview: { isEmpty: true } })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
})

it('sums up the memory, the CPUs and the storage of the site', () => {
  const wrapper = mountResourcesOverview()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('total-memory'), '512 GiB'],
    [t('total-cpus'), '48'],
    [t('total-storage-repository'), '4 TiB'],
  ])
})
