import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { patch, schedulesByJobId } = vi.hoisted(() => ({
  patch: vi.fn(),
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPatch: patch as unknown as typeof fetchPatch,
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    schedulesByJobId: ref(schedulesByJobId),
  })) as unknown as typeof useXoScheduleCollection,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  patch.mockReset()
  patch.mockResolvedValue(undefined)
  schedulesByJobId.clear()
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

function mountChangeStateJob(backupJobs: FrontAnyXoBackupJob[], enabled: boolean) {
  return mountComposable(() => useXoBackupJobChangeStateJob(() => backupJobs, enabled)).wrapper.vm
}

describe('run', () => {
  it.each([true, false])('sets the state of the schedule of every backup job to enabled: %s', async enabled => {
    await mountChangeStateJob(
      [createBackupJobWithSchedules('backup-job-1'), createBackupJobWithSchedules('backup-job-2')],
      enabled
    ).run()

    expect(patch.mock.calls).toEqual([
      ['schedules/backup-job-1-schedule-0', { enabled }],
      ['schedules/backup-job-2-schedule-0', { enabled }],
    ])
  })

  it('reports each backup job result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('No such schedule')
    patch.mockRejectedValueOnce(error)

    const results = await mountChangeStateJob(
      [createBackupJobWithSchedules('backup-job-1'), createBackupJobWithSchedules('backup-job-2')],
      true
    ).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
  })
})

describe('validate', () => {
  it('can change the state of backup jobs with a single schedule', () => {
    expect(mountChangeStateJob([createBackupJobWithSchedules('backup-job-1')], false).canRun).toBe(true)
  })

  it('cannot run without backup job', () => {
    const job = mountChangeStateJob([], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:missing-backup-job'))
  })

  it('cannot change the state of a backup job with multiple schedules', () => {
    const job = mountChangeStateJob([createBackupJobWithSchedules('backup-job-1', 2)], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:multiple-schedules', { n: 1 }))
  })

  it('cannot change the state of a selection where at least one backup job has multiple schedules', () => {
    const job = mountChangeStateJob(
      [createBackupJobWithSchedules('backup-job-1', 2), createBackupJobWithSchedules('backup-job-2')],
      true
    )

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:multiple-schedules', { n: 2 }))
  })

  it('cannot change the state of a backup job without schedule', () => {
    const job = mountChangeStateJob([createBackupJobWithSchedules('backup-job-1', 0)], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:no-schedule', { n: 1 }))
  })
})
