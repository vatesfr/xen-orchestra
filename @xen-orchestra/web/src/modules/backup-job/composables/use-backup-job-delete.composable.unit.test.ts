import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import {
  confirmModalOpening,
  createConfirmedAction,
  createDetachedJobRun,
  itAsksToTypeToConfirm,
  itOpensSingleModal,
  itUnselectsOnSuccess,
} from '@/test/detached-selection-job.ts'
import { t } from '@/test/i18n.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { type MaybeRefOrGetter, toValue } from 'vue'

const deleteJob = createJobStub(useXoBackupJobDeleteJob)
const detachedRun = createDetachedJobRun(deleteJob.run)

mockModule(import('@core/composables/route-query.composable.ts'), () => import('@/test/mock-route-query.ts'))

mockModule(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  deleteJob.reset()
  routeQueryMock.reset()
})

const firstBackupJob = createVmBackupJob({ id: 'backup-job-1' as FrontAnyXoBackupJob['id'] })
const secondBackupJob = createVmBackupJob({ id: 'backup-job-2' as FrontAnyXoBackupJob['id'] })

const deleteAction = createConfirmedAction({
  // Handed a plain list, see `itemsChange` below
  use: (backupJobs: MaybeRefOrGetter<FrontAnyXoBackupJob[]>) => useBackupJobDelete(toValue(backupJobs)),
  start: result => result.deleteBackupJobs(),
  detachedRun,
})

describe('deleteBackupJobs', () => {
  itOpensSingleModal(
    'opens the delete modal named after the backup job for a single backup job',
    deleteAction,
    firstBackupJob,
    [
      confirmModalOpening({
        accent: 'danger',
        subject: firstBackupJob.name,
        description: t('modal:backup-job-delete-message', { n: 1 }),
        confirmLabel: t('action:delete-n-jobs', { n: 1 }),
      }),
    ]
  )

  it('names a backup job without name as untitled in the delete modal', () => {
    const { singleModal } = deleteAction.open([createVmBackupJob({ name: undefined })])

    expect(singleModal.open).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ subject: t('untitled') }) })
    )
  })

  itAsksToTypeToConfirm(
    'asks to type the number of backup jobs to confirm for several backup jobs',
    deleteAction,
    [firstBackupJob, secondBackupJob],
    {
      title: t('modal:backup-job-delete-title', { n: 2 }),
      description: t('modal:backup-job-delete-message', { n: 2 }),
      confirmationText: t('n-jobs', { n: 2 }),
      confirmLabel: t('action:delete-n-jobs', { n: 2 }),
    }
  )
})

describe('on confirm', () => {
  itUnselectsOnSuccess(
    {
      wording: { item: 'backup job', items: 'backup jobs', done: 'deleted', doing: 'deleting' },
      items: [firstBackupJob, secondBackupJob],
      detachedRun,
      confirm: deleteAction.confirm,
      errorMessage: 'No such backup job',
    },
    // `deleteAction` hands the composable a plain list
    { itemsChange: false }
  )
})
