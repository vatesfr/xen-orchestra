import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

export function useRestoreVmBackupArchive(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const backupArchive = toComputed(rawBackupArchive)

  const { open } = useOverlay({
    component: () => import('@/modules/backup-archive/components/drawer/RestoreVmBackupArchiveDrawer.vue'),
    events: {
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    backupArchive: backupArchive.value,
  }))

  function restoreVmBackupArchive() {
    return open({ props })
  }

  return {
    restoreVmBackupArchive,
  }
}
