import { useXoBackupJobLastRuns } from '@/modules/backup-job/composables/use-xo-backup-job-last-runs.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { backupLogCollectionMock } from '@/test/mock-xo-backup-log-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { useI18n } from 'vue-i18n'

mockModule(
  import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'),
  () => import('@/test/mock-xo-backup-log-collection.ts')
)

const backupJob = createVmBackupJob()

beforeEach(() => {
  backupLogCollectionMock.reset()
})

function mountLastRuns(backupJob: FrontAnyXoBackupJob) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { lastRuns: useXoBackupJobLastRuns(backupJob), t }
  }).wrapper.vm
}

describe('useXoBackupJobLastRuns', () => {
  it('only gives the runs of the backup job', () => {
    backupLogCollectionMock.backupLogs.value = [
      createBackupLog({ jobId: backupJob.id, status: 'success' }),
      createBackupLog({ jobId: 'other-backup-job' as FrontXoBackupLog['jobId'], status: 'failure' }),
    ]

    expect(mountLastRuns(backupJob).lastRuns.map(run => run.status)).toEqual(['success'])
  })

  it('gives the status of each run, with its number, date and status in the tooltip', () => {
    backupLogCollectionMock.backupLogs.value = [
      createBackupLog({ jobId: backupJob.id, status: 'failure', start: 1_700_000_200_000, end: 1_700_000_300_000 }),
      createBackupLog({ jobId: backupJob.id, status: 'success', start: 1_700_000_000_000, end: 1_700_000_100_000 }),
    ]

    const result = mountLastRuns(backupJob)

    expect(result.lastRuns).toEqual([
      {
        status: 'failure',
        tooltip: `${result.t('last-run-number', { n: 1 })}: ${formatDateTime(1_700_000_300_000)}, ${result.t('failure')}`,
      },
      {
        status: 'success',
        tooltip: `${result.t('last-run-number', { n: 2 })}: ${formatDateTime(1_700_000_100_000)}, ${result.t('success')}`,
      },
    ])
  })

  it('dates a run still in progress by its start', () => {
    backupLogCollectionMock.backupLogs.value = [
      createBackupLog({ jobId: backupJob.id, status: 'pending', start: 1_700_000_000_000, end: undefined }),
    ]

    const result = mountLastRuns(backupJob)

    expect(result.lastRuns).toEqual([
      {
        status: 'pending',
        tooltip: `${result.t('last-run-number', { n: 1 })}: ${formatDateTime(1_700_000_000_000)}, ${result.t('in-progress')}`,
      },
    ])
  })

  it('has no run for a backup job that never ran', () => {
    expect(mountLastRuns(createVmBackupJob()).lastRuns).toEqual([])
  })
})
