import SiteDashboardStorageRepository from '@/modules/site/components/dashboard/SiteDashboardStorageRepository.vue'
import type {
  StorageRepositoriesFormatted,
  useXoSiteDashboard,
} from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import { ONE_TB } from '@/shared/constants.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { findCardHeading } from '@/test/find-card-heading.ts'
import { findCardNumbers, findLegends } from '@/test/find-labelled-values.ts'
import { isLoading } from '@/test/find-loader.ts'
import { findStateHeroText } from '@/test/find-state-hero.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { mount } from '@vue/test-utils'

// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})

function createStorageRepositories(): StorageRepositoriesFormatted {
  return {
    total: formatSizeRaw(4 * ONE_TB, 1),
    used: formatSizeRaw(3 * ONE_TB, 1),
    available: formatSizeRaw(1 * ONE_TB, 1),
    replicated: formatSizeRaw(2 * ONE_TB, 1),
    other: formatSizeRaw(1 * ONE_TB, 1),
  }
}

/** Left out, the repositories have not arrived yet — which is what the card shows a loader for. */
function mountStorageRepository(storageRepositories?: StorageRepositoriesFormatted) {
  siteDashboard.storageRepositoriesFormatted.value = storageRepositories

  return mount(SiteDashboardStorageRepository, { global: createGlobalTestConfig() })
}

it('names the card and says what the storage it breaks down is for', () => {
  const wrapper = mountStorageRepository(createStorageRepositories())

  expect(findCardHeading(wrapper)).toEqual({ title: t('storage-repository'), description: t('for-replication') })
})

it('shows a loader alone while the storage repositories have not arrived', () => {
  const wrapper = mountStorageRepository()

  expect(isLoading(wrapper)).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('reports that there is nothing to compute when the site has no storage repository', () => {
  const wrapper = mountStorageRepository({ isEmpty: true })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
  expect(findLegends(wrapper)).toEqual([])
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('splits the used storage between the replications and the rest', () => {
  const wrapper = mountStorageRepository(createStorageRepositories())

  expect(findLegends(wrapper)).toEqual([
    [t('xo-replications'), '2 TiB'],
    [t('other'), '1 TiB'],
  ])
})

it('sums up what the storage repositories use, leave available and hold in total', () => {
  const wrapper = mountStorageRepository(createStorageRepositories())

  expect(findCardNumbers(wrapper)).toEqual([
    [t('used-for-backup'), '3 TiB'],
    [t('available'), '1 TiB'],
    [t('total'), '4 TiB'],
  ])
})

it('shows an error message when the storage repositories could not be fetched', () => {
  const wrapper = mountStorageRepository({ error: true })

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(wrapper.get('.ui-card').classes('has-error')).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountStorageRepository(createStorageRepositories())

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})
