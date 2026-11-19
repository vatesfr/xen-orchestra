import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itReportsEachResult } from '@/test/job-cases.ts'
import { backupLogCollectionMock, mockXoBackupLogCollection } from '@/test/mock-xo-backup-log-collection.ts'
import { scheduleCollectionMock, mockXoScheduleCollection } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedBackupJobWithSchedules } from '@/test/seed-backup-job-schedules.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

mockXoScheduleCollection()

mockXoBackupLogCollection()

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockResolvedValue(undefined)
  scheduleCollectionMock.reset()
  backupLogCollectionMock.reset()
})

function mountRunJob(backupJobs: FrontAnyXoBackupJob[]) {
  return mountComposable(() => useXoBackupJobRunJob(() => backupJobs)).wrapper.vm
}

describe('run', () => {
  it('runs the schedule of every backup job', async () => {
    const firstBackupJob = seedBackupJobWithSchedules('backup-job-1')
    const secondBackupJob = seedBackupJobWithSchedules('backup-job-2')

    await mountRunJob([firstBackupJob, secondBackupJob]).run()

    expect(post.mock.calls).toEqual([
      ['schedules/backup-job-1-schedule-0/actions/run'],
      ['schedules/backup-job-2-schedule-0/actions/run'],
    ])
  })

  itReportsEachResult({
    subject: 'backup job',
    request: post,
    errorMessage: 'the job is already running',
    run: () =>
      mountRunJob([seedBackupJobWithSchedules('backup-job-1'), seedBackupJobWithSchedules('backup-job-2')]).run(),
  })
})

describe('validate', () => {
  it('can run backup jobs with a single schedule', () => {
    expect(mountRunJob([seedBackupJobWithSchedules('backup-job-1')]).canRun).toBe(true)
  })

  it('can run a disabled backup job', () => {
    const backupJob = createVmBackupJob()
    scheduleCollectionMock.schedules.value = [createSchedule({ jobId: backupJob.id, enabled: false })]

    expect(mountRunJob([backupJob]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without backup job',
      mountJob: () => mountRunJob([]),
      errorMessage: t('job:backup-job-run:missing-backup-job'),
    },
    {
      name: 'cannot run a backup job with multiple schedules',
      mountJob: () => mountRunJob([seedBackupJobWithSchedules('backup-job-1', 2)]),
      errorMessage: t('job:backup-job-run:multiple-schedules', { n: 1 }),
    },
    {
      name: 'cannot run a selection where at least one backup job has multiple schedules',
      mountJob: () =>
        mountRunJob([seedBackupJobWithSchedules('backup-job-1', 2), seedBackupJobWithSchedules('backup-job-2')]),
      errorMessage: t('job:backup-job-run:multiple-schedules', { n: 2 }),
    },
    {
      name: 'cannot run a backup job without schedule',
      mountJob: () => mountRunJob([seedBackupJobWithSchedules('backup-job-1', 0)]),
      errorMessage: t('job:backup-job-run:no-schedule', { n: 1 }),
    },
    {
      name: 'cannot run a backup job already running',
      mountJob: () => {
        const backupJob = seedBackupJobWithSchedules('backup-job-1')
        backupLogCollectionMock.backupLogs.value = [createBackupLog({ jobId: backupJob.id, status: 'pending' })]

        return mountRunJob([backupJob])
      },
      errorMessage: t('job:backup-job-run:already-running', { n: 1 }),
    },
  ])

  it('can run a backup job whose last run is over', () => {
    const backupJob = seedBackupJobWithSchedules('backup-job-1')
    backupLogCollectionMock.backupLogs.value = [createBackupLog({ jobId: backupJob.id, status: 'success' })]

    expect(mountRunJob([backupJob]).canRun).toBe(true)
  })
})
