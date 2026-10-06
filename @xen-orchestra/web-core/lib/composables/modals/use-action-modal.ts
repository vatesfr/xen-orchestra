import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useActionModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsActionModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })
}
