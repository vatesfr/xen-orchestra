import {
  type NewBackupRepositoryPayload,
  useXoBackupRepositoryCreateJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-create.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewBackupRepository() {
  const payload = ref<NewBackupRepositoryPayload>()

  const { run } = useXoBackupRepositoryCreateJob(payload)

  const { open: openNewBackupRepositoryDrawer } = useOverlay({
    component: () => import('@/modules/backup-repository/components/drawer/NewBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewBackupRepositoryPayload) => {
        payload.value = newPayload

        try {
          const [result] = await run()

          if (result.status === 'rejected') {
            console.error('Failed to create backup repository', result.reason)
            return KEEP_OVERLAY_OPEN
          }
        } catch (error) {
          console.error('Error when creating backup repository', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  return {
    openNewBackupRepositoryDrawer,
  }
}
