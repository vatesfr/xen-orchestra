import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import {
  createDetachedJobRun,
  createRouterOnPage,
  itRedirectsOnSuccess,
  itUnselectsOnSuccess,
  typeToConfirmModalOpening,
} from '@/test/detached-selection-job.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'
import type { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'
import type { Router } from 'vue-router'

type PartialDeletionDrawer = { events: { onConfirm?: () => void } }

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

function mountDelete(vms: MaybeRefOrGetter<FrontXoVm[]>, { router = createTestRouter() }: { router?: Router } = {}) {
  return mountComposable(() => useVmDelete(vms), { router }).wrapper.vm
}

async function deleteAndConfirm(vms: MaybeRefOrGetter<FrontXoVm[]>, options?: { router?: Router }) {
  mountDelete(vms, options).deleteVms()

  const [openOptions] = deleteModalMock.open.mock.lastCall ?? openTypeToConfirmModal.mock.lastCall ?? []

  openOptions.events.onConfirm()

  await detachedRun.settled()
}

const VM_PAGE = '/vm/[id]/dashboard'

const deleteCase = {
  wording: { item: 'VM', items: 'VMs', done: 'deleted', doing: 'deleting' },
  items: [firstVm, secondVm] as [FrontXoVm, FrontXoVm],
  detachedRun,
  confirm: deleteAndConfirm,
  errorMessage: 'VM is running',
}

describe('deleteVms', () => {
  it('asks to confirm the deletion of a single VM by its name', () => {
    mountDelete([firstVm]).deleteVms()

    expect(deleteModalMock.open.mock.calls[0][0].props).toEqual({
      accent: 'danger',
      subject: 'Web server',
      description: t('vm-delete-warning'),
      confirmLabel: t('action:delete-n-vms', { n: 1 }),
    })
    expect(openTypeToConfirmModal).not.toHaveBeenCalled()
  })

  it('asks to type the number of VMs to confirm the deletion of several VMs', () => {
    mountDelete([firstVm, secondVm]).deleteVms()

    expect(openTypeToConfirmModal.mock.calls[0][0].props).toEqual(
      typeToConfirmModalOpening({
        title: t('modal:vm-delete-title', { n: 2 }),
        description: t('modal:vms-delete-message', { n: 2 }),
        confirmationText: t('n-vms', { n: 2 }),
        confirmLabel: t('action:delete-n-vms', { n: 2 }),
      }).props
    )
    expect(deleteModalMock.open).not.toHaveBeenCalled()
  })

  it('does not delete anything until confirmed', () => {
    mountDelete([firstVm, secondVm]).deleteVms()

    expect(run).not.toHaveBeenCalled()
  })
})

describe('with protected VMs', () => {
  it('only hands the job the VMs not protected against deletion', () => {
    mountDelete([firstVm, protectedVm, secondVm])

    const jobVms = toValue(useDeleteJob.mock.calls[0][0] as MaybeRefOrGetter<FrontXoVm[]>)

    expect(jobVms.map(vm => vm.id)).toEqual([firstVm.id, secondVm.id])
  })

  it('shows which VMs will be deleted and which are protected', () => {
    mountDelete([firstVm, protectedVm]).deleteVms()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({
      props: { deletableVms: [firstVm], protectedVms: [protectedVm] },
    })
    expect(deleteModalMock.open).not.toHaveBeenCalled()
    expect(openTypeToConfirmModal).not.toHaveBeenCalled()
  })

  it('deletes the other VMs once the partial deletion is confirmed', () => {
    mountDelete([firstVm, protectedVm]).deleteVms()

    overlayMock.getOverlay<PartialDeletionDrawer>().events.onConfirm?.()

    expect(run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('unselects the VM shown in the side panel once deleted alongside a protected one', () => {
    detachedRun.mockSuccess([{ status: 'fulfilled', value: undefined }])
    routeQueryMock.query.value = secondVm.id

    mountDelete([protectedVm, secondVm]).deleteVms()
    overlayMock.getOverlay<PartialDeletionDrawer>().events.onConfirm?.()

    expect(routeQueryMock.query.value).toBe('')
  })

  it('forbids deleting when every VM is protected', () => {
    const result = mountDelete([protectedVm])

    expect(result.canDeleteVms).toBe(false)
    expect(result.deleteVmsErrorMessage).toBe(t('job:vm-delete:blocked-operation'))
  })
})

describe('on confirm', () => {
  itUnselectsOnSuccess(deleteCase)
})

it('exposes whether the VMs can be deleted, are being deleted, and why they cannot be', () => {
  useDeleteJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

  const result = mountDelete([firstVm])

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

    await deleteAndConfirm(vms, { router })

    expect(router.currentRoute.value).toMatchObject({ name: '/host/[id]/vms', params: { id: firstVm.$container } })
  })
})
