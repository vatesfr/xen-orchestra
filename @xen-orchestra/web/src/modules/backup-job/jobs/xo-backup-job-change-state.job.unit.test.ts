import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedBackupJobWithSchedules } from '@/test/seed-backup-job-schedules.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'

const patch = mockedExport(fetchPatch)

mockModule(
  import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'),
  () => import('@/test/mock-xo-schedule-collection.ts')
)

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

  it('reports each backup job result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('No such schedule')
    patch.mockRejectedValueOnce(error)

    const results = await mountChangeStateJob(
      [seedBackupJobWithSchedules('backup-job-1'), seedBackupJobWithSchedules('backup-job-2')],
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
    expect(mountChangeStateJob([seedBackupJobWithSchedules('backup-job-1')], false).canRun).toBe(true)
  })

  it('cannot run without backup job', () => {
    const job = mountChangeStateJob([], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:missing-backup-job'))
  })

  it('cannot change the state of a backup job with multiple schedules', () => {
    const job = mountChangeStateJob([seedBackupJobWithSchedules('backup-job-1', 2)], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:multiple-schedules', { n: 1 }))
  })

  it('cannot change the state of a selection where at least one backup job has multiple schedules', () => {
    const job = mountChangeStateJob(
      [seedBackupJobWithSchedules('backup-job-1', 2), seedBackupJobWithSchedules('backup-job-2')],
      true
    )

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:multiple-schedules', { n: 2 }))
  })

  it('cannot change the state of a backup job without schedule', () => {
    const job = mountChangeStateJob([seedBackupJobWithSchedules('backup-job-1', 0)], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-change-state:no-schedule', { n: 1 }))
  })
})
