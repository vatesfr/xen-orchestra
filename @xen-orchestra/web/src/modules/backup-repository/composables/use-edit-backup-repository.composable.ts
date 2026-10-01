import {
  type EditBackupRepositoryPayload,
  useXoBackupRepositoryEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useEditBackupRepository() {
  const br = ref<FrontXoBackupRepository>()

  const payload = ref<EditBackupRepositoryPayload>()

  const { $context } = useXoBackupRepositoryCollection()

  const { run } = useXoBackupRepositoryEditJob(br, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/backup-repository/components/drawer/EditBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: async (newPayload: EditBackupRepositoryPayload) => {
        payload.value = newPayload

        try {
          await run()

          // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
          $context.forceReload()
        } catch (error) {
          console.error('Error when edit backup repository', error)
        }
      },
      onCancel: true,
    },
  })

  function openEditBackupRepositoryDrawer(newBr: FrontXoBackupRepository) {
    br.value = newBr

    return open({ props: { br: newBr } })
  }

  return {
    openEditBackupRepositoryDrawer,
  }
}
