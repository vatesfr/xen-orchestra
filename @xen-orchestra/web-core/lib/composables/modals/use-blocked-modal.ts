import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useBlockedModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsBlockedModal.vue'),
    events: {
      onClose: true,
    },
  })
}
