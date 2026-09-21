import SiteDashboardBackupIssues from '@/modules/site/components/dashboard/SiteDashboardBackupIssues.vue'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { BackupIssue, XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { createBackupIssue } from '@/test/create-backup-issue.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { findCardHeading, findCardTitleHref } from '@/test/find-card-heading.ts'
import { isLoading } from '@/test/find-loader.ts'
import { findStateHeroText } from '@/test/find-state-hero.ts'
import { findTableCell, findTableRows } from '@/test/find-table-rows.ts'
import { t } from '@/test/i18n.ts'

// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})

const mountBackupIssues = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardBackupIssues, overrides)

/** The backups the site reports, with only the jobs in trouble changed. */
function createBackups(issues: BackupIssue[]): XoDashboard['backups'] {
  return {
    jobs: { disabled: 1, failed: 2, noRecentRun: 3, skipped: 4, successful: 9, total: 19 },
    issues,
    vmsProtection: { protected: 12, unprotected: 5, notInJob: 6 },
  }
}

it('names the card, counts the jobs in trouble and links to the backups page', () => {
  const wrapper = mountBackupIssues()

  expect(findCardHeading(wrapper)).toEqual({
    title: `${t('backups:jobs:issues')} 1`,
    info: t('action:see-all'),
    description: t('in-last-three-runs'),
  })
  expect(findCardTitleHref(wrapper)).toBe('/backups')
})

it('shows a loader while the backups have not arrived', () => {
  const wrapper = mountBackupIssues({ backups: undefined })

  expect(isLoading(wrapper)).toBe(true)
  expect(findTableRows(wrapper)).toEqual([])
})

it('reports the failure when the backups could not be fetched', () => {
  const wrapper = mountBackupIssues({ backups: { error: true } })

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findTableRows(wrapper)).toEqual([])
})

it('reports that there is nothing to compute when the site runs no backup', () => {
  const wrapper = mountBackupIssues({ backups: { isEmpty: true } })

  expect(findStateHeroText(wrapper)).toBe(t('no-data-to-calculate'))
  expect(findTableRows(wrapper)).toEqual([])
})

it('reports that every backup ran without a hitch when no job is in trouble', () => {
  const wrapper = mountBackupIssues({
    backups: createBackups([]),
  })

  expect(findStateHeroText(wrapper)).toContain(t('backups:jobs:issues-ran-without-hitch'))
  expect(findTableRows(wrapper)).toEqual([])
})

it('drops the counter and the link when no job is in trouble', () => {
  const wrapper = mountBackupIssues({
    backups: createBackups([]),
  })

  expect(findCardHeading(wrapper)).toEqual({
    title: t('backups:jobs:issues'),
    description: t('in-last-three-runs'),
  })
})

it('lists one row per backup job in trouble, under the columns it names', () => {
  const wrapper = mountBackupIssues({
    backups: createBackups([createBackupIssue(), createBackupIssue({ uuid: 'backup-job-456', name: 'Weekly backup' })]),
  })

  expect(findTableRows(wrapper)).toEqual([
    { [t('backup-job')]: 'Nightly backup', [t('last-n-runs', { n: 3 })]: '' },
    { [t('backup-job')]: 'Weekly backup', [t('last-n-runs', { n: 3 })]: '' },
  ])
  expect(
    findTableCell(wrapper, { row: 1, column: t('backup-job') })
      .get('a')
      .attributes('href')
  ).toBe('/backup/backup-job-456/runs')
})

it('shows one marker per run of a job', () => {
  const wrapper = mountBackupIssues({
    backups: createBackups([createBackupIssue({ logs: ['failure', 'skipped'] })]),
  })

  expect(findTableCell(wrapper, { row: 0, column: t('last-n-runs', { n: 3 }) }).findAll('.status')).toHaveLength(2)
})

it('names a backup job the site left untitled', () => {
  const wrapper = mountBackupIssues({
    backups: createBackups([createBackupIssue({ name: undefined })]),
  })

  expect(findTableCell(wrapper, { row: 0, column: t('backup-job') }).text()).toBe(t('untitled'))
})
