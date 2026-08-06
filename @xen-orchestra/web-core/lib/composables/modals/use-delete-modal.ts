import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useDeleteModal() {
  return useOverlay({
    component: () => import('@core/components/modal/VtsDeleteModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })
}
