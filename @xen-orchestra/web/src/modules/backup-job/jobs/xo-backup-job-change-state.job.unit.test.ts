import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itReportsEachResult } from '@/test/job-cases.ts'
import { scheduleCollectionMock, mockXoScheduleCollection } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedBackupJobWithSchedules } from '@/test/seed-backup-job-schedules.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const patch = mockedExport(fetchPatch)

mockXoScheduleCollection()

beforeEach(() => {
  vi.restoreAllMocks()
  patch.mockResolvedValue(undefined)
  scheduleCollectionMock.reset()
})

function mountChangeStateJob(backupJobs: FrontAnyXoBackupJob[], enabled: boolean) {
  return mountComposable(() => useXoBackupJobChangeStateJob(() => backupJobs, enabled)).wrapper.vm
}

describe('run', () => {
  it.each([true, false])('sets the state of the schedule of every backup job to enabled: %s', async enabled => {
    await mountChangeStateJob(
      [seedBackupJobWithSchedules('backup-job-1'), seedBackupJobWithSchedules('backup-job-2')],
      enabled
    ).run()

    expect(patch.mock.calls).toEqual([
      ['schedules/backup-job-1-schedule-0', { enabled }],
      ['schedules/backup-job-2-schedule-0', { enabled }],
    ])
  })

  itReportsEachResult({
    subject: 'backup job',
    request: patch,
    errorMessage: 'No such schedule',
    run: () =>
      mountChangeStateJob(
        [seedBackupJobWithSchedules('backup-job-1'), seedBackupJobWithSchedules('backup-job-2')],
        true
      ).run(),
  })
})

describe('validate', () => {
  it('can change the state of backup jobs with a single schedule', () => {
    expect(mountChangeStateJob([seedBackupJobWithSchedules('backup-job-1')], false).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without backup job',
      mountJob: () => mountChangeStateJob([], true),
      errorMessage: t('job:backup-job-change-state:missing-backup-job'),
    },
    {
      name: 'cannot change the state of a backup job with multiple schedules',
      mountJob: () => mountChangeStateJob([seedBackupJobWithSchedules('backup-job-1', 2)], true),
      errorMessage: t('job:backup-job-change-state:multiple-schedules', { n: 1 }),
    },
    {
      name: 'cannot change the state of a selection where at least one backup job has multiple schedules',
      mountJob: () =>
        mountChangeStateJob(
          [seedBackupJobWithSchedules('backup-job-1', 2), seedBackupJobWithSchedules('backup-job-2')],
          true
        ),
      errorMessage: t('job:backup-job-change-state:multiple-schedules', { n: 2 }),
    },
    {
      name: 'cannot change the state of a backup job without schedule',
      mountJob: () => mountChangeStateJob([seedBackupJobWithSchedules('backup-job-1', 0)], true),
      errorMessage: t('job:backup-job-change-state:no-schedule', { n: 1 }),
    },
  ])
})
