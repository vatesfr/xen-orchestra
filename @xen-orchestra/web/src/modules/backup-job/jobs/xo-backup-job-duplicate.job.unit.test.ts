import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { post, schedulesByJobId } = vi.hoisted(() => ({
  post: vi.fn(),
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    schedulesByJobId: ref(schedulesByJobId),
  })) as unknown as typeof useXoScheduleCollection,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockReset()
  post.mockResolvedValue({ id: 'new-backup-job' })
  schedulesByJobId.clear()
})

const backupJob = createVmBackupJob({ id: 'backup-job-1' as FrontAnyXoBackupJob['id'], name: 'Nightly backup' })

function mountDuplicateJob(backupJobs: FrontAnyXoBackupJob[]) {
  return mountComposable(() => useXoBackupJobDuplicateJob(() => backupJobs)).wrapper.vm
}

describe('run', () => {
  it('creates a copy of the backup job with its schedules', async () => {
    const schedule = createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], jobId: backupJob.id })
    schedulesByJobId.set(backupJob.id, [schedule])

    await mountDuplicateJob([backupJob]).run()

    const [[endpoint, payload]] = post.mock.calls

    expect(endpoint).toBe('backup-jobs')
    expect(payload).toMatchObject({
      name: t('backup-job-copy-name', { name: 'Nightly backup' }),
      schedules: {
        [schedule.id]: { cron: schedule.cron, name: schedule.name, timezone: schedule.timezone, enabled: true },
      },
    })
  })

  it('names the copy of a backup job without name after untitled', async () => {
    await mountDuplicateJob([createVmBackupJob({ name: undefined })]).run()

    expect(post.mock.lastCall?.[1].name).toBe(t('backup-job-copy-name', { name: t('untitled') }))
  })

  it('reports each backup job result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Invalid parameters')
    post.mockRejectedValueOnce(error)

    const results = await mountDuplicateJob([backupJob, createVmBackupJob()]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: { id: 'new-backup-job' } },
    ])
  })
})

describe('validate', () => {
  it('can run with backup jobs', () => {
    expect(mountDuplicateJob([backupJob]).canRun).toBe(true)
  })

  it('cannot run without backup job', () => {
    const job = mountDuplicateJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-duplicate:missing-backup-job'))
  })
})
