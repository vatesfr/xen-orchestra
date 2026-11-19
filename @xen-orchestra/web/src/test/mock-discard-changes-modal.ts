import type { useDiscardChangesModal as realUseDiscardChangesModal } from '@core/composables/modals/use-discard-changes-modal.ts'

type DiscardChangesModalEvent = 'onConfirm' | 'onCancel'

// The "discard unsaved changes?" overlay cannot be answered from a unit test: the test answers it here, reset it in
// `beforeEach`
export const discardChangesModalMock = {
  open: vi.fn(),
  answer(event: DiscardChangesModalEvent) {
    this.open.mockResolvedValue({ event })
  },
  reset() {
    this.open.mockReset()
  },
}

// Use as `vi.mock(import('@core/composables/modals/use-discard-changes-modal.ts'), () =>
// import('@/test/mock-discard-changes-modal.ts'))`
export const useDiscardChangesModal = (() => ({
  open: discardChangesModalMock.open,
})) as unknown as typeof realUseDiscardChangesModal
