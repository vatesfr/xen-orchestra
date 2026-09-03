import {
  type NewBackupRepositoryPayload,
  useXoBackupRepositoryCreateJob,
} from '@/modules/backup/jobs/xo-backup-repository-create.job.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewBackupRepository() {
  const payload = ref<NewBackupRepositoryPayload>()

  const { $context } = useXoBackupRepositoryCollection()

  const { run } = useXoBackupRepositoryCreateJob(payload)

  const { open: openNewBackupRepositoryDrawer } = useOverlay({
    component: () => import('@/modules/backup/components/repository/drawer/NewBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewBackupRepositoryPayload) => {
        payload.value = newPayload
        try {
          const [result] = await run()

          if (result.status === 'rejected') {
            console.error('Failed to create backup repository', result.reason)
          } else {
            // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
            $context.forceReload()
          }
        } catch (error) {
          console.error('Error when create backup repository', error)
        }
      },
      onCancel: true,
    },
  })

  return {
    openNewBackupRepositoryDrawer,
  }
}
