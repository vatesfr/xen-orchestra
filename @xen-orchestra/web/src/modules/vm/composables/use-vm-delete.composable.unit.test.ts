import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import {
  confirmModalOpening,
  createConfirmedAction,
  createDetachedJobRun,
  createRouterOnPage,
  type SelectionJobCase,
  itAsksToTypeToConfirm,
  itOpensSingleModal,
  itRedirectsOnSuccess,
  itUnselectsOnSuccess,
} from '@/test/detached-selection-job.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'
import type { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

// The job deletes the VMs through the REST API
const useDeleteJob = mockedExport(useXoVmDeleteJob)

const run = vi.fn()
const detachedRun = createDetachedJobRun(run)
const openTypeToConfirmModal = vi.fn()

mockModule(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

mockModule(import('@core/composables/modals/use-type-to-confirm-modal.ts'), () => ({
  useTypeToConfirmModal: (() => ({ open: openTypeToConfirmModal })) as unknown as typeof useTypeToConfirmModal,
}))

// The partial deletion drawer is the only overlay the composable opens directly
mockModule(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

mockModule(import('@core/composables/route-query.composable.ts'), () => import('@/test/mock-route-query.ts'))

beforeEach(() => {
  run.mockReset()
  useDeleteJob.mockReturnValue(createJobResult(run))
  deleteModalMock.reset()
  openTypeToConfirmModal.mockReset()
  overlayMock.reset()
  routeQueryMock.reset()
})

const firstVm = createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' })
const secondVm = createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' })
const protectedVm = createVm({
  id: 'vm-protected' as FrontXoVm['id'],
  name_label: 'Backup server',
  blockedOperations: { destroy: 'Protected' } as FrontXoVm['blockedOperations'],
})

const deleteAction = createConfirmedAction({
  use: useVmDelete,
  start: result => result.deleteVms(),
  detachedRun,
  getModals: () => ({ singleModal: deleteModalMock, typeToConfirmModal: { open: openTypeToConfirmModal } }),
})

const VM_PAGE = '/vm/[id]/dashboard'

const deleteCase: SelectionJobCase<FrontXoVm> = {
  wording: { item: 'VM', items: 'VMs', done: 'deleted', doing: 'deleting' },
  items: [firstVm, secondVm],
  detachedRun,
  confirm: deleteAction.confirm,
  errorMessage: 'VM is running',
}

describe('deleteVms', () => {
  itOpensSingleModal('asks to confirm the deletion of a single VM by its name', deleteAction, firstVm, [
    confirmModalOpening({
      accent: 'danger',
      subject: 'Web server',
      description: t('vm-delete-warning'),
      confirmLabel: t('action:delete-n-vms', { n: 1 }),
    }),
  ])

  itAsksToTypeToConfirm(
    'asks to type the number of VMs to confirm the deletion of several VMs',
    deleteAction,
    [firstVm, secondVm],
    {
      title: t('modal:vm-delete-title', { n: 2 }),
      description: t('modal:vms-delete-message', { n: 2 }),
      confirmationText: t('n-vms', { n: 2 }),
      confirmLabel: t('action:delete-n-vms', { n: 2 }),
    }
  )

  it('does not delete anything until confirmed', () => {
    deleteAction.open([firstVm, secondVm])

    expect(run).not.toHaveBeenCalled()
  })
})

describe('with protected VMs', () => {
  it('only hands the job the VMs not protected against deletion', () => {
    deleteAction.mount([firstVm, protectedVm, secondVm])

    const jobVms = toValue(useDeleteJob.mock.calls[0][0] as MaybeRefOrGetter<FrontXoVm[]>)

    expect(jobVms.map(vm => vm.id)).toEqual([firstVm.id, secondVm.id])
  })

  it('shows which VMs will be deleted and which are protected', () => {
    deleteAction.open([firstVm, protectedVm])

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({
      props: { deletableVms: [firstVm], protectedVms: [protectedVm] },
    })
    expect(deleteModalMock.open).not.toHaveBeenCalled()
    expect(openTypeToConfirmModal).not.toHaveBeenCalled()
  })

  it('deletes the other VMs once the partial deletion is confirmed', () => {
    deleteAction.open([firstVm, protectedVm])

    overlayMock.confirmOpened()

    expect(run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('unselects the VM shown in the side panel once deleted alongside a protected one', () => {
    detachedRun.mockSuccess([{ status: 'fulfilled', value: undefined }])
    routeQueryMock.query.value = secondVm.id

    deleteAction.open([protectedVm, secondVm])
    overlayMock.confirmOpened()

    expect(routeQueryMock.query.value).toBe('')
  })

  it('forbids deleting when every VM is protected', () => {
    const result = deleteAction.mount([protectedVm])

    expect(result.canDeleteVms).toBe(false)
    expect(result.deleteVmsErrorMessage).toBe(t('job:vm-delete:blocked-operation'))
  })
})

describe('on confirm', () => {
  itUnselectsOnSuccess(deleteCase)
})

it('exposes whether the VMs can be deleted, are being deleted, and why they cannot be', () => {
  useDeleteJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

  const result = deleteAction.mount([firstVm])

  expect(result.canDeleteVms).toBe(false)
  expect(result.isDeletingVms).toBe(true)
  expect(result.deleteVmsErrorMessage).toBe('In progress')
})

describe('redirection', () => {
  itRedirectsOnSuccess(deleteCase, {
    itemPage: VM_PAGE,
    redirection: {
      to: vm => ({ name: '/host/[id]/vms', params: { id: vm.$container } }),
      wording: 'to the VMs of its host',
    },
  })

  it('redirects even when the deleted VM leaves the collection before the job is over', async () => {
    const vms = ref([firstVm])
    detachedRun.mockSuccess([{ status: 'fulfilled', value: undefined }], () => {
      vms.value = []
    })
    const router = await createRouterOnPage(VM_PAGE, firstVm.id)

    await deleteAction.confirm(vms, { router })

    expect(router.currentRoute.value).toMatchObject({ name: '/host/[id]/vms', params: { id: firstVm.$container } })
  })
})
