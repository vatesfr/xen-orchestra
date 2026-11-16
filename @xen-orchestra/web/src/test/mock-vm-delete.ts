import type { useVmDelete as realUseVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { ref } from 'vue'

// `useVmDelete` calls the REST API and opens modals: a test of one of its callers gets this fake instead. Reset it in
// `beforeEach`
export const vmDeleteMock = {
  // The spy to read the VM the caller asked to delete
  useVmDelete: vi.fn(),
  deleteVm: vi.fn(),
  // Whether the VM is being deleted, for the callers mounted next
  setDeleting(isDeletingVm: boolean) {
    this.useVmDelete.mockReturnValue({ deleteVm: this.deleteVm, isDeletingVm: ref(isDeletingVm) })
  },
  reset() {
    this.useVmDelete.mockReset()
    this.deleteVm.mockReset()
    this.setDeleting(false)
  },
}

// Use as `vi.mock(import('@/modules/vm/composables/use-vm-delete.composable.ts'), () => import('@/test/mock-vm-delete.ts'))`
export const useVmDelete = vmDeleteMock.useVmDelete as unknown as typeof realUseVmDelete
