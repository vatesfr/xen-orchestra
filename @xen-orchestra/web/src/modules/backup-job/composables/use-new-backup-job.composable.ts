import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useNewBackupJob() {
  const { open: openNewBackupJobDrawer } = useOverlay({
    component: () => import('@/modules/backup-job/components/drawer/NewBackupJobDrawer.vue'),
    events: {
      onCancel: true,
    },
  })

  return {
    openNewBackupJobDrawer,
  }
}
