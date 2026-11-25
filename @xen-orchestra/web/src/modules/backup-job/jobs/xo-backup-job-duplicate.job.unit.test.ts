import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itReportsEachResult } from '@/test/job-cases.ts'
import { scheduleCollectionMock, mockXoScheduleCollection } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

mockXoScheduleCollection()

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockResolvedValue({ id: 'new-backup-job' })
  scheduleCollectionMock.reset()
})

const backupJob = createVmBackupJob({ id: 'backup-job-1' as FrontAnyXoBackupJob['id'], name: 'Nightly backup' })

function mountDuplicateJob(backupJobs: FrontAnyXoBackupJob[]) {
  return mountComposable(() => useXoBackupJobDuplicateJob(() => backupJobs)).wrapper.vm
}

describe('run', () => {
  it('creates a copy of the backup job with its schedules', async () => {
    const schedule = createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], jobId: backupJob.id })
    scheduleCollectionMock.schedules.value = [schedule]

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

  itReportsEachResult({
    subject: 'backup job',
    request: post,
    errorMessage: 'Invalid parameters',
    run: () => mountDuplicateJob([backupJob, createVmBackupJob()]).run(),
    fulfilledValue: { id: 'new-backup-job' },
  })
})

describe('validate', () => {
  it('can run with backup jobs', () => {
    expect(mountDuplicateJob([backupJob]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without backup job',
      mountJob: () => mountDuplicateJob([]),
      errorMessage: t('job:backup-job-duplicate:missing-backup-job'),
    },
  ])
})
