import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useDisabledHostInfoModal() {
  return useOverlay({
    component: () => import('@/shared/components/modals/DisabledHostInfoModal.vue'),
    events: {
      onClose: true,
    },
  })
}
