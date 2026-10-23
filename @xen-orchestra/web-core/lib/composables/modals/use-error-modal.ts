import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useErrorModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsErrorModal.vue'),
    events: {
      onClose: true,
    },
  })
}
