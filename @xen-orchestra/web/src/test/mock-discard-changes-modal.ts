import { mockModule } from '@/test/spy-on-module.ts'
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

// Mocked with `mockDiscardChangesModal()`
export const useDiscardChangesModal = (() => ({
  open: discardChangesModalMock.open,
})) as unknown as typeof realUseDiscardChangesModal

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockDiscardChangesModal() {
  mockModule(
    import('@core/composables/modals/use-discard-changes-modal.ts'),
    () => import('@/test/mock-discard-changes-modal.ts')
  )
}
