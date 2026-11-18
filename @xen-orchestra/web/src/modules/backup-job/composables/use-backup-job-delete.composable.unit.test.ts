import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'

type DeleteResults = PromiseSettledResult<unknown>[]

const deleteJob = createJobStub(useXoBackupJobDeleteJob)

mockModule(import('@core/composables/route-query.composable.ts'), () => import('@/test/mock-route-query.ts'))

mockModule(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  deleteJob.reset()
  routeQueryMock.reset()
})

function mockDeleteSuccess(results: DeleteResults) {
  deleteJob.run.mockImplementation(({ onSuccess }: { onSuccess: (results: DeleteResults) => void }) =>
    onSuccess(results)
  )
}

const firstBackupJob = createVmBackupJob({ id: 'backup-job-1' as FrontAnyXoBackupJob['id'] })
const secondBackupJob = createVmBackupJob({ id: 'backup-job-2' as FrontAnyXoBackupJob['id'] })

function mountDelete(backupJobs: FrontAnyXoBackupJob[]) {
  const result = mountComposable(() => useBackupJobDelete(backupJobs)).wrapper.vm

  const [deleteModal, typeToConfirmModal] = overlayMock.getOverlays()

  return { result, deleteModal, typeToConfirmModal }
}

function deleteAndConfirm(backupJobs: FrontAnyXoBackupJob[]) {
  const { result } = mountDelete(backupJobs)

  result.deleteBackupJobs()

  overlayMock.confirmOpened()
}

describe('deleteBackupJobs', () => {
  it('opens the delete modal named after the backup job for a single backup job', () => {
    const { result, deleteModal, typeToConfirmModal } = mountDelete([firstBackupJob])

    result.deleteBackupJobs()

    expect(deleteModal.open).toHaveBeenCalledWith({
      props: {
        accent: 'danger',
        subject: firstBackupJob.name,
        description: t('modal:backup-job-delete-message', { n: 1 }),
        confirmLabel: t('action:delete-n-jobs', { n: 1 }),
      },
      events: {
        onConfirm: expect.any(Function),
      },
    })
    expect(typeToConfirmModal.open).not.toHaveBeenCalled()
  })

  it('names a backup job without name as untitled in the delete modal', () => {
    const { result, deleteModal } = mountDelete([createVmBackupJob({ name: undefined })])

    result.deleteBackupJobs()

    expect(deleteModal.open).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ subject: t('untitled') }) })
    )
  })

  it('asks to type the number of backup jobs to confirm for several backup jobs', () => {
    const { result, deleteModal, typeToConfirmModal } = mountDelete([firstBackupJob, secondBackupJob])

    result.deleteBackupJobs()

    expect(deleteModal.open).not.toHaveBeenCalled()
    expect(typeToConfirmModal.open).toHaveBeenCalledWith({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:backup-job-delete-title', { n: 2 }),
        description: t('modal:backup-job-delete-message', { n: 2 }),
        confirmationText: t('n-jobs', { n: 2 }),
        confirmLabel: t('action:delete-n-jobs', { n: 2 }),
      },
      events: {
        onConfirm: expect.any(Function),
      },
    })
  })
})

describe('on confirm', () => {
  it('runs the job detached so the modal closes right away', () => {
    deleteAndConfirm([firstBackupJob])

    expect(deleteJob.run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('unselects the backup job shown in the side panel once deleted', () => {
    mockDeleteSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])
    routeQueryMock.query.value = secondBackupJob.id

    deleteAndConfirm([firstBackupJob, secondBackupJob])

    expect(routeQueryMock.query.value).toBe('')
  })

  it('keeps the backup job shown in the side panel selected when deleting it failed', () => {
    mockDeleteSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('No such backup job') },
    ])
    routeQueryMock.query.value = secondBackupJob.id

    deleteAndConfirm([firstBackupJob, secondBackupJob])

    expect(routeQueryMock.query.value).toBe(secondBackupJob.id)
  })

  it('keeps another backup job shown in the side panel selected', () => {
    mockDeleteSuccess([{ status: 'fulfilled', value: undefined }])
    routeQueryMock.query.value = secondBackupJob.id

    deleteAndConfirm([firstBackupJob])

    expect(routeQueryMock.query.value).toBe(secondBackupJob.id)
  })
})
