import SiteDashboardS3BackupRepository from '@/modules/site/components/dashboard/SiteDashboardS3BackupRepository.vue'
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

const mountS3BackupRepository = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardS3BackupRepository, overrides)

it('names the card and says what the storage it reports is for', () => {
  const wrapper = mountS3BackupRepository()

  expect(findCardHeading(wrapper)).toEqual({ title: t('s3-backup-repository'), description: t('for-backup') })
})

it('shows a loader while the backup repositories have not arrived', () => {
  const wrapper = mountS3BackupRepository({ backupRepositories: undefined })

  expect(isLoading(wrapper)).toBe(true)
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('reports that there is nothing to compute when the site has no backup repository', () => {
  const wrapper = mountS3BackupRepository({ backupRepositories: { isEmpty: true } })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('reports that there is nothing to compute when no backup repository is an S3 one', () => {
  const wrapper = mountS3BackupRepository({ backupRepositories: { other: { size: { backups: 1024 } } } })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountS3BackupRepository()

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows what the S3 repositories hold in backups', () => {
  const wrapper = mountS3BackupRepository()

  expect(findCardNumbers(wrapper)).toEqual([[t('used-for-backup'), '2 TiB']])
})
