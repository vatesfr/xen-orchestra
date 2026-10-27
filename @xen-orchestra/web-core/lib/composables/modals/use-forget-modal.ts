import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useForgetModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsForgetModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })
}
