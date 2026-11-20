import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useDiscardChangesModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsDiscardChangesModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })
}
