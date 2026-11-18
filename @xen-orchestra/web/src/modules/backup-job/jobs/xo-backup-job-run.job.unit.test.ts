import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { backupLogCollectionMock } from '@/test/mock-xo-backup-log-collection.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedBackupJobWithSchedules } from '@/test/seed-backup-job-schedules.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

mockModule(
  import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'),
  () => import('@/test/mock-xo-schedule-collection.ts')
)

mockModule(
  import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'),
  () => import('@/test/mock-xo-backup-log-collection.ts')
)

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

  it('reports each backup job result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('the job is already running')
    post.mockRejectedValueOnce(error)

    const results = await mountRunJob([
      seedBackupJobWithSchedules('backup-job-1'),
      seedBackupJobWithSchedules('backup-job-2'),
    ]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
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

  it('cannot run without backup job', () => {
    const job = mountRunJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:missing-backup-job'))
  })

  it('cannot run a backup job with multiple schedules', () => {
    const job = mountRunJob([seedBackupJobWithSchedules('backup-job-1', 2)])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:multiple-schedules', { n: 1 }))
  })

  it('cannot run a selection where at least one backup job has multiple schedules', () => {
    const job = mountRunJob([seedBackupJobWithSchedules('backup-job-1', 2), seedBackupJobWithSchedules('backup-job-2')])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:multiple-schedules', { n: 2 }))
  })

  it('cannot run a backup job without schedule', () => {
    const job = mountRunJob([seedBackupJobWithSchedules('backup-job-1', 0)])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:no-schedule', { n: 1 }))
  })

  it('cannot run a backup job already running', () => {
    const backupJob = seedBackupJobWithSchedules('backup-job-1')
    backupLogCollectionMock.backupLogs.value = [createBackupLog({ jobId: backupJob.id, status: 'pending' })]

    const job = mountRunJob([backupJob])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:already-running', { n: 1 }))
  })

  it('can run a backup job whose last run is over', () => {
    const backupJob = seedBackupJobWithSchedules('backup-job-1')
    backupLogCollectionMock.backupLogs.value = [createBackupLog({ jobId: backupJob.id, status: 'success' })]

    expect(mountRunJob([backupJob]).canRun).toBe(true)
  })
})
