import type { useDeleteModal as realUseDeleteModal } from '@core/composables/modals/use-delete-modal.ts'

type DeleteModalEvent = 'onConfirm' | 'onCancel'

// The confirmation overlay cannot be answered from a unit test: the test answers it here, reset it in `beforeEach`
export const deleteModalMock = {
  open: vi.fn(),
  answer(event: DeleteModalEvent) {
    this.open.mockResolvedValue({ event })
  },
  reset() {
    this.open.mockReset()
  },
}

// Use as `vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))`
export const useDeleteModal = (() => ({ open: deleteModalMock.open })) as unknown as typeof realUseDeleteModal
