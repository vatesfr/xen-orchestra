import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useVmProtectedInfoModal() {
  return useOverlay({
    component: () => import('@/shared/components/modals/VmProtectedInfoModal.vue'),
    events: {
      onClose: true,
    },
  })
}
