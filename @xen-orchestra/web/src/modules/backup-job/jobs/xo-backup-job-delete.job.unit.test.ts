import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { del } = vi.hoisted(() => ({
  del: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchDelete: del as unknown as typeof fetchDelete,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  del.mockReset()
  del.mockResolvedValue(undefined)
})

const firstBackupJob = createVmBackupJob({ id: 'backup-job-1' as FrontAnyXoBackupJob['id'] })
const secondBackupJob = createVmBackupJob({ id: 'backup-job-2' as FrontAnyXoBackupJob['id'] })

function mountDeleteJob(backupJobs: FrontAnyXoBackupJob[]) {
  return mountComposable(() => useXoBackupJobDeleteJob(() => backupJobs)).wrapper.vm
}

describe('run', () => {
  it('deletes every backup job', async () => {
    await mountDeleteJob([firstBackupJob, secondBackupJob]).run()

    expect(del.mock.calls).toEqual([[`backup-jobs/${firstBackupJob.id}`], [`backup-jobs/${secondBackupJob.id}`]])
  })

  it('reports each backup job result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('No such backup job')
    del.mockRejectedValueOnce(error)

    const results = await mountDeleteJob([firstBackupJob, secondBackupJob]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
  })
})

describe('validate', () => {
  it('can run with backup jobs', () => {
    expect(mountDeleteJob([firstBackupJob]).canRun).toBe(true)
  })

  it('cannot run without backup job', () => {
    const job = mountDeleteJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-job-delete:missing-backup-job'))
  })
})
