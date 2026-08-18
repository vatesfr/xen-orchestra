import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useNewBackupRepository() {
  const { open: openNewBackupRepositoryDrawer } = useOverlay({
    component: () => import('@/modules/backup/components/repository/drawer/NewBackupRepositoryDrawer.vue'),
    events: {
      onCancel: true,
    },
  })

  return {
    openNewBackupRepositoryDrawer,
  }
}
