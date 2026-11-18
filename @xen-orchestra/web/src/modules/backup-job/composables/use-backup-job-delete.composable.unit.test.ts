import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import type { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

type OverlayEvents = { onConfirm?: () => void }

type DeleteResults = PromiseSettledResult<unknown>[]

type MockedOverlay = { open: ReturnType<typeof vi.fn>; events: OverlayEvents }

const { overlays, run, selectedBackupJobId } = vi.hoisted(() => ({
  overlays: [] as MockedOverlay[],
  run: vi.fn(),
  selectedBackupJobId: { value: '' },
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'), () => ({
  useXoBackupJobDeleteJob: (() => ({
    run,
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref(undefined),
  })) as unknown as typeof useXoBackupJobDeleteJob,
}))

vi.mock(import('@core/composables/route-query.composable.ts'), () => ({
  useRouteQuery: (() => selectedBackupJobId) as unknown as typeof useRouteQuery,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: (({ events }: Pick<MockedOverlay, 'events'>) => {
    const overlay = { open: vi.fn(), events }

    overlays.push(overlay)

    return { open: overlay.open }
  }) as unknown as typeof useOverlay,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  overlays.length = 0
  run.mockReset()
  selectedBackupJobId.value = ''
})

function mockDeleteSuccess(results: DeleteResults) {
  run.mockImplementation(({ onSuccess }: { onSuccess: (results: DeleteResults) => void }) => onSuccess(results))
}

const firstBackupJob = createVmBackupJob({ id: 'backup-job-1' as FrontAnyXoBackupJob['id'] })
const secondBackupJob = createVmBackupJob({ id: 'backup-job-2' as FrontAnyXoBackupJob['id'] })

function mountDelete(backupJobs: FrontAnyXoBackupJob[]) {
  const result = mountComposable(() => useBackupJobDelete(backupJobs)).wrapper.vm

  const [deleteModal, typeToConfirmModal] = overlays

  return { result, deleteModal, typeToConfirmModal }
}

function deleteAndConfirm(backupJobs: FrontAnyXoBackupJob[]) {
  const { result } = mountDelete(backupJobs)

  result.deleteBackupJobs()

  const openedModal = overlays.find(overlay => overlay.open.mock.calls.length > 0)

  const openEvents: OverlayEvents | undefined = openedModal?.open.mock.lastCall?.[0]?.events

  ;(openEvents?.onConfirm ?? openedModal?.events.onConfirm)?.()
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

    expect(run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('unselects the backup job shown in the side panel once deleted', () => {
    mockDeleteSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])
    selectedBackupJobId.value = secondBackupJob.id

    deleteAndConfirm([firstBackupJob, secondBackupJob])

    expect(selectedBackupJobId.value).toBe('')
  })

  it('keeps the backup job shown in the side panel selected when deleting it failed', () => {
    mockDeleteSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('No such backup job') },
    ])
    selectedBackupJobId.value = secondBackupJob.id

    deleteAndConfirm([firstBackupJob, secondBackupJob])

    expect(selectedBackupJobId.value).toBe(secondBackupJob.id)
  })

  it('keeps another backup job shown in the side panel selected', () => {
    mockDeleteSuccess([{ status: 'fulfilled', value: undefined }])
    selectedBackupJobId.value = secondBackupJob.id

    deleteAndConfirm([firstBackupJob])

    expect(selectedBackupJobId.value).toBe(secondBackupJob.id)
  })
})
