import { confirmOpenedModal } from '@/test/mock-overlay.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { useDeleteModal as realUseDeleteModal } from '@core/composables/modals/use-delete-modal.ts'

type DeleteModalEvent = 'onConfirm' | 'onCancel'

// The confirmation overlay cannot be answered from a unit test: the test answers it here, reset it in `beforeEach`
export const deleteModalMock = {
  open: vi.fn(),
  answer(event: DeleteModalEvent) {
    this.open.mockResolvedValue({ event })
  },
  // For a confirmation that runs its `onConfirm` event instead of awaiting the answer
  confirm() {
    confirmOpenedModal([this])
  },
  reset() {
    this.open.mockReset()
  },
}

// Mocked with `mockDeleteModal()`
export const useDeleteModal = (() => ({ open: deleteModalMock.open })) as unknown as typeof realUseDeleteModal

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockDeleteModal() {
  mockModule(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))
}
