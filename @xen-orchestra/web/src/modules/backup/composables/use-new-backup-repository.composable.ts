import {
  type NewBackupRepositoryPayload,
  useXoBackupRepositoryCreateJob,
} from '@/modules/backup/jobs/xo-backup-repository-create.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewBackupRepository() {
  const payload = ref<NewBackupRepositoryPayload>()

  const { run } = useXoBackupRepositoryCreateJob(payload)

  const { open: openNewBackupRepositoryDrawer } = useOverlay({
    component: () => import('@/modules/backup/components/repository/drawer/NewBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewBackupRepositoryPayload) => {
        payload.value = newPayload

        const [result] = await run()

        console.log('result', result)

        if (result.status === 'rejected') {
          console.error('Failed to create backup repository', result.reason)
        }

        return result
      },
      onCancel: true,
    },
  })

  return {
    openNewBackupRepositoryDrawer,
  }
}
