import SiteDashboardBackupRepository from '@/modules/site/components/dashboard/SiteDashboardBackupRepository.vue'
import type {
  BackupRepositoriesFormatted,
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

function createBackupRepositories(): BackupRepositoriesFormatted {
  return {
    total: formatSizeRaw(8 * ONE_TB, 1),
    used: formatSizeRaw(5 * ONE_TB, 1),
    available: formatSizeRaw(3 * ONE_TB, 1),
    backups: formatSizeRaw(4 * ONE_TB, 1),
    other: formatSizeRaw(1 * ONE_TB, 1),
  }
}

/** Left out, the repositories have not arrived yet — which is what the card shows a loader for. */
function mountBackupRepository(backupRepositories?: BackupRepositoriesFormatted) {
  siteDashboard.backupRepositoriesFormatted.value = backupRepositories

  return mount(SiteDashboardBackupRepository, { global: createGlobalTestConfig() })
}

it('names the card and says what the storage it breaks down is for', () => {
  const wrapper = mountBackupRepository(createBackupRepositories())

  expect(findCardHeading(wrapper)).toEqual({ title: t('backup-repository-type'), description: t('for-backup') })
})

it('shows a loader alone while the backup repositories have not arrived', () => {
  const wrapper = mountBackupRepository()

  expect(isLoading(wrapper)).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('reports that there is nothing to compute when the site has no backup repository', () => {
  const wrapper = mountBackupRepository({ isEmpty: true })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
  expect(findLegends(wrapper)).toEqual([])
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows an error message when the backup repositories could not be fetched', () => {
  const wrapper = mountBackupRepository({ error: true })

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(wrapper.get('.ui-card').classes('has-error')).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountBackupRepository(createBackupRepositories())

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})

it('splits the used storage between the backups and the rest', () => {
  const wrapper = mountBackupRepository(createBackupRepositories())

  expect(findLegends(wrapper)).toEqual([
    [t('xo-backups'), '4 TiB'],
    [t('other'), '1 TiB'],
  ])
})

it('sums up what the backup repositories use, leave available and hold in total', () => {
  const wrapper = mountBackupRepository(createBackupRepositories())

  expect(findCardNumbers(wrapper)).toEqual([
    [t('used-for-backup'), '5 TiB'],
    [t('available'), '3 TiB'],
    [t('total'), '8 TiB'],
  ])
})
