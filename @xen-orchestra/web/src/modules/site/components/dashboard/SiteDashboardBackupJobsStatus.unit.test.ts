import SiteDashboardBackupJobsStatus from '@/modules/site/components/dashboard/SiteDashboardBackupJobsStatus.vue'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { findCardHeading, findCardTitleHref } from '@/test/find-card-heading.ts'
import { findCardNumbers, findLegends } from '@/test/find-labelled-values.ts'
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

const mountBackupJobsStatus = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardBackupJobsStatus, overrides)

it('names the card, links to the backups page and says which period it covers', () => {
  const wrapper = mountBackupJobsStatus()

  expect(findCardHeading(wrapper)).toEqual({
    title: t('backups:jobs:status'),
    info: t('action:see-all'),
    description: t('backups:jobs:last-seven-days'),
  })
  expect(findCardTitleHref(wrapper)).toBe('/backups')
})

it('shows a loader while the backups have not arrived', () => {
  const wrapper = mountBackupJobsStatus({ backups: undefined })

  expect(isLoading(wrapper)).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountBackupJobsStatus()

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})

it('invites the user to configure a backup job when the site runs none', () => {
  const wrapper = mountBackupJobsStatus({ backups: { isEmpty: true } })

  expect(wrapper.get('.ui-alert').text()).toContain(t('no-active-backup-jobs'))
  expect(wrapper.get('.ui-alert a').attributes('href')).toBe('/backups')
  expect(findLegends(wrapper)).toEqual([])
})

it('drops the see-all link and the period from the heading when the site runs no backup job', () => {
  const wrapper = mountBackupJobsStatus({ backups: { isEmpty: true } })

  expect(findCardHeading(wrapper)).toEqual({ title: t('backups:jobs:status') })
})

it('breaks down the backup jobs by status', () => {
  const wrapper = mountBackupJobsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('backups:jobs:running-good'), '9'],
    [t('backups:jobs:skipped-runs'), '4'],
    [t('backups:jobs:errors-detected'), '2'],
    [t('backups:jobs:no-recent-run'), '3'],
  ])
})

it('totals the backup jobs of the site', () => {
  const wrapper = mountBackupJobsStatus()

  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '19']])
})
