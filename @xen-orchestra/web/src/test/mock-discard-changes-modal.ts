import type { useDiscardChangesModal as realUseDiscardChangesModal } from '@core/composables/modals/use-discard-changes-modal.ts'

type DiscardChangesModalEvent = 'onConfirm' | 'onCancel'

export const discardChangesModalMock = {
  open: vi.fn(),
  answer(event: DiscardChangesModalEvent) {
    this.open.mockResolvedValue({ event })
  },
  reset() {
    this.open.mockReset()
  },
}

export const useDiscardChangesModal = (() => ({
  open: discardChangesModalMock.open,
})) as unknown as typeof realUseDiscardChangesModal
