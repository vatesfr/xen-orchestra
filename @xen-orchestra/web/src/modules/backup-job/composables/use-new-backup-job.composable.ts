import {
  type NewBackupJobPayload,
  useXoBackupJobCreateJob,
} from '@/modules/backup-job/jobs/xo-backup-job-create.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewBackupJob() {
  const payload = ref<NewBackupJobPayload>()

  const { run } = useXoBackupJobCreateJob(payload)

  const { open: openNewBackupJobDrawer } = useOverlay({
    component: () => import('@/modules/backup-job/components/drawer/NewBackupJobDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewBackupJobPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when creating backup job', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  return {
    openNewBackupJobDrawer,
  }
}
