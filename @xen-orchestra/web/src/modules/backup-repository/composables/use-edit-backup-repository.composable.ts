import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useEditBackupRepository() {
  const { open } = useOverlay({
    component: () => import('@/modules/backup-repository/components/drawer/EditBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function openEditBackupRepositoryDrawer(br: FrontXoBackupRepository) {
    return open({ props: { br } })
  }

  return {
    openEditBackupRepositoryDrawer,
  }
}
