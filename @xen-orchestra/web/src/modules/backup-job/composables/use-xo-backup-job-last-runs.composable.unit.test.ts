import { useXoBackupJobLastRuns } from '@/modules/backup-job/composables/use-xo-backup-job-last-runs.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { useI18n } from 'vue-i18n'

const { getLastNBackupLogsByJobId } = vi.hoisted(() => ({
  getLastNBackupLogsByJobId: vi.fn(),
}))

vi.mock(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({ getLastNBackupLogsByJobId })) as unknown as typeof useXoBackupLogCollection,
}))

beforeEach(() => {
  getLastNBackupLogsByJobId.mockReset()
  getLastNBackupLogsByJobId.mockReturnValue([])
})

function mountLastRuns(backupJob: FrontAnyXoBackupJob) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { lastRuns: useXoBackupJobLastRuns(backupJob), t }
  }).wrapper.vm
}

describe('useXoBackupJobLastRuns', () => {
  it('only gives the runs of the backup job', () => {
    const backupJob = createVmBackupJob()

    getLastNBackupLogsByJobId.mockImplementation((jobId: FrontAnyXoBackupJob['id']) =>
      jobId === backupJob.id ? [createBackupLog({ status: 'success' })] : [createBackupLog({ status: 'failure' })]
    )

    expect(mountLastRuns(backupJob).lastRuns.map(run => run.status)).toEqual(['success'])
  })

  it('gives the status of each run, with its number, date and status in the tooltip', () => {
    getLastNBackupLogsByJobId.mockReturnValue([
      createBackupLog({ status: 'failure', start: 1_700_000_200_000, end: 1_700_000_300_000 }),
      createBackupLog({ status: 'success', start: 1_700_000_000_000, end: 1_700_000_100_000 }),
    ])

    const result = mountLastRuns(createVmBackupJob())

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
    getLastNBackupLogsByJobId.mockReturnValue([
      createBackupLog({ status: 'pending', start: 1_700_000_000_000, end: undefined }),
    ])

    const result = mountLastRuns(createVmBackupJob())

    expect(result.lastRuns).toEqual([
      {
        status: 'pending',
        tooltip: `${result.t('last-run-number', { n: 1 })}: ${formatDateTime(1_700_000_000_000)}, ${result.t('pending')}`,
      },
    ])
  })

  it('has no run for a backup job that never ran', () => {
    expect(mountLastRuns(createVmBackupJob()).lastRuns).toEqual([])
  })
})
