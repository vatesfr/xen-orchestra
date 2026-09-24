import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useInfoModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsInfoModal.vue'),
    events: {
      onClose: true,
    },
  })
}
