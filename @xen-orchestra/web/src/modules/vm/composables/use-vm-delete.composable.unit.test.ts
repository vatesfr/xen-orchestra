import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import type { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { flushPromises } from '@vue/test-utils'
import type { Router } from 'vue-router'

const { openBlockedModal } = vi.hoisted(() => ({ openBlockedModal: vi.fn() }))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

vi.mock(import('@core/composables/modals/use-blocked-modal.ts'), () => ({
  useBlockedModal: (() => ({ open: openBlockedModal })) as unknown as typeof useBlockedModal,
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

beforeEach(() => {
  deleteModalMock.reset()
  openBlockedModal.mockReset()
})

const VM = createVm()

const POOL_VM = createVm({ $container: VM.$pool })

function mountVmDelete(vm: FrontXoVm = VM, router: Router = createTestRouter()) {
  return mountComposable(() => useVmDelete(vm), { router }).wrapper.vm
}

function hasDeleted(vm: FrontXoVm) {
  return hasRequested('DELETE', `vms/${vm.id}`)
}

// Where the app is once the VM is deleted from that page
async function deleteFrom(path: string, vm: FrontXoVm = VM) {
  stubFetchResponse(200, {})
  const router = createTestRouter()
  await router.push(path)

  mountVmDelete(vm, router).deleteVm()
  deleteModalMock.confirm()
  await flushPromises()

  return router.currentRoute.value.fullPath
}

describe('deleteVm', () => {
  it('asks to confirm the deletion of the VM, by its name', () => {
    mountVmDelete().deleteVm()

    expect(deleteModalMock.open.mock.lastCall?.[0].props).toEqual({
      subject: VM.name_label,
      description: t('vm-delete-warning'),
      confirmLabel: t('action:delete-n-vms', { n: 1 }),
    })
  })

  it('deletes nothing until confirmed', () => {
    mountVmDelete().deleteVm()

    expect(hasDeleted(VM)).toBe(false)
  })

  it('deletes the VM once confirmed', () => {
    mountVmDelete().deleteVm()

    deleteModalMock.confirm()

    expect(hasDeleted(VM)).toBe(true)
  })

  it('tells why a VM whose deletion is blocked cannot be deleted, without asking to confirm', () => {
    mountVmDelete(
      createVm({ blockedOperations: { destroy: 'protected' } as FrontXoVm['blockedOperations'] })
    ).deleteVm()

    expect(openBlockedModal.mock.lastCall?.[0]).toEqual({
      props: { blockedOperation: 'destroy', href: `https://xo5.example.com/#/vms/${VM.id}/advanced` },
    })
    expect(deleteModalMock.open).not.toHaveBeenCalled()
  })

  it.each([
    ['the VMs of its host', VM, `/host/${VM.$container}/vms`],
    ['the VMs of its pool when it runs on no host', POOL_VM, `/pool/${VM.$pool}/vms`],
  ])('leaves the page of the deleted VM for %s', async (_, vm, path) => {
    expect(await deleteFrom(`/vm/${vm.id}/dashboard`, vm)).toBe(path)
  })

  it('stays on a page that is not the page of the VM', async () => {
    expect(await deleteFrom(`/pool/${VM.$pool}/vms`)).toBe(`/pool/${VM.$pool}/vms`)
  })
})

describe('isDeletingVm', () => {
  it('is true while the VM is being deleted', () => {
    const vmDelete = mountVmDelete()

    vmDelete.deleteVm()
    deleteModalMock.confirm()

    expect(vmDelete.isDeletingVm).toBe(true)
  })
})
