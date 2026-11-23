import type { useVmDelete as realUseVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { computed, ref } from 'vue'

// `useVmDelete` calls the REST API and opens modals: a test of one of its callers gets this fake instead. Reset it in
// `beforeEach`
export const vmDeleteMock = {
  // The spy to read the VMs the caller asked to delete
  useVmDelete: vi.fn(),
  deleteVms: vi.fn(),
  isDeletingVms: ref(false),
  deleteVmsErrorMessage: ref<string>(),
  // Whether the VMs are being deleted
  setDeleting(isDeletingVms: boolean) {
    this.isDeletingVms.value = isDeletingVms
  },
  // Why the VMs cannot be deleted
  setBlocked(errorMessage: string) {
    this.deleteVmsErrorMessage.value = errorMessage
  },
  reset() {
    this.useVmDelete.mockReset()
    this.deleteVms.mockReset()
    this.isDeletingVms.value = false
    this.deleteVmsErrorMessage.value = undefined
    this.useVmDelete.mockReturnValue({
      deleteVms: this.deleteVms,
      isDeletingVms: this.isDeletingVms,
      canDeleteVms: computed(() => this.deleteVmsErrorMessage.value === undefined),
      deleteVmsErrorMessage: this.deleteVmsErrorMessage,
    })
  },
}

// Mocked with `mockVmDelete()`
export const useVmDelete = vmDeleteMock.useVmDelete as unknown as typeof realUseVmDelete

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockVmDelete() {
  mockModule(import('@/modules/vm/composables/use-vm-delete.composable.ts'), () => import('@/test/mock-vm-delete.ts'))
}
