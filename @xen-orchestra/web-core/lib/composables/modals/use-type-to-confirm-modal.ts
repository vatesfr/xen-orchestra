import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useTypeToConfirmModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsTypeToConfirmModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })
}
