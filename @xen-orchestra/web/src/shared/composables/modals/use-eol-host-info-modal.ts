import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useEolHostInfoModal() {
  return useOverlay({
    component: () => import('@/shared/components/modals/EolHostInfoModal.vue'),
    events: {
      onClose: true,
    },
  })
}
