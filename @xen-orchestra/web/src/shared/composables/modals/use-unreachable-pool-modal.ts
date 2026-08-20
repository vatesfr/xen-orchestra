import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useUnreachablePoolModal() {
  return useOverlay({
    component: () => import('@/shared/components/modals/UnreachablePoolModal.vue'),
    events: {
      onClose: true,
    },
  })
}
