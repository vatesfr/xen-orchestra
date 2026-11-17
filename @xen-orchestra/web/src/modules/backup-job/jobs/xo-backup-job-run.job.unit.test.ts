import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoBackupLog,
  useXoBackupLogCollection,
} from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { post, schedulesByJobId, backupLogsByJobId } = vi.hoisted(() => ({
  post: vi.fn(),
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
  backupLogsByJobId: new Map<string, FrontXoBackupLog[]>(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    schedulesByJobId: ref(schedulesByJobId),
  })) as unknown as typeof useXoScheduleCollection,
}))

vi.mock(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({
    backupLogsByJobId: ref(backupLogsByJobId),
  })) as unknown as typeof useXoBackupLogCollection,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockReset()
  post.mockResolvedValue(undefined)
  schedulesByJobId.clear()
  backupLogsByJobId.clear()
})

function createBackupJobWithSchedules(id: string, scheduleCount = 1) {
  const backupJob = createVmBackupJob({ id: id as FrontAnyXoBackupJob['id'] })

  schedulesByJobId.set(
    backupJob.id,
    Array.from({ length: scheduleCount }, (_, index) =>
      createSchedule({ id: `${id}-schedule-${index}` as FrontXoSchedule['id'], jobId: backupJob.id })
    )
  )

  return backupJob
}

function mountRunJob(backupJobs: FrontAnyXoBackupJob[]) {
  return mountComposable(() => useXoBackupJobRunJob(() => backupJobs)).wrapper.vm
}

describe('run', () => {
  it('runs the schedule of every backup job', async () => {
    const firstBackupJob = createBackupJobWithSchedules('backup-job-1')
    const secondBackupJob = createBackupJobWithSchedules('backup-job-2')

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
      createBackupJobWithSchedules('backup-job-1'),
      createBackupJobWithSchedules('backup-job-2'),
    ]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
  })
})

describe('validate', () => {
  it('can run backup jobs with a single schedule', () => {
    expect(mountRunJob([createBackupJobWithSchedules('backup-job-1')]).canRun).toBe(true)
  })

  it('can run a disabled backup job', () => {
    const backupJob = createVmBackupJob()
    schedulesByJobId.set(backupJob.id, [createSchedule({ jobId: backupJob.id, enabled: false })])

    expect(mountRunJob([backupJob]).canRun).toBe(true)
  })

  it('cannot run without backup job', () => {
    const job = mountRunJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:missing-backup-job'))
  })

  it('cannot run a backup job with multiple schedules', () => {
    const job = mountRunJob([createBackupJobWithSchedules('backup-job-1', 2)])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:multiple-schedules', { n: 1 }))
  })

  it('cannot run a selection where at least one backup job has multiple schedules', () => {
    const job = mountRunJob([
      createBackupJobWithSchedules('backup-job-1', 2),
      createBackupJobWithSchedules('backup-job-2'),
    ])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:multiple-schedules', { n: 2 }))
  })

  it('cannot run a backup job without schedule', () => {
    const job = mountRunJob([createBackupJobWithSchedules('backup-job-1', 0)])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:no-schedule', { n: 1 }))
  })

  it('cannot run a backup job already running', () => {
    const backupJob = createBackupJobWithSchedules('backup-job-1')
    backupLogsByJobId.set(backupJob.id, [createBackupLog({ jobId: backupJob.id, status: 'pending' })])

    const job = mountRunJob([backupJob])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-run:already-running', { n: 1 }))
  })

  it('can run a backup job whose last run is over', () => {
    const backupJob = createBackupJobWithSchedules('backup-job-1')
    backupLogsByJobId.set(backupJob.id, [createBackupLog({ jobId: backupJob.id, status: 'success' })])

    expect(mountRunJob([backupJob]).canRun).toBe(true)
  })
})
