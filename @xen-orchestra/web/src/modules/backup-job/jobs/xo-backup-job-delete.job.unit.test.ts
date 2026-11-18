import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itReportsEachResult } from '@/test/job-cases.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const del = mockedExport(fetchDelete)

beforeEach(() => {
  vi.restoreAllMocks()
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

  itReportsEachResult({
    subject: 'backup job',
    request: del,
    errorMessage: 'No such backup job',
    run: () => mountDeleteJob([firstBackupJob, secondBackupJob]).run(),
  })
})

describe('validate', () => {
  it('can run with backup jobs', () => {
    expect(mountDeleteJob([firstBackupJob]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without backup job',
      mountJob: () => mountDeleteJob([]),
      errorMessage: t('job:backup-job-delete:missing-backup-job'),
    },
  ])
})
