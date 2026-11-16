import { type EditBackupJobPayload, useXoBackupJobEditJob } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useEditBackupJob(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const payload = ref<EditBackupJobPayload>()

  const {
    run,
    canRun: canEditBackupJob,
    isRunning: isEditingBackupJob,
    errorMessage: editBackupJobErrorMessage,
  } = useXoBackupJobEditJob(backupJob, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/backup-job/components/drawer/EditBackupJobDrawer.vue'),
    events: {
      onConfirm: async (newPayload: EditBackupJobPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when editing backup job', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    backupJob: backupJob.value,
  }))

  function editBackupJob() {
    return open({ props })
  }

  return {
    editBackupJob,
    canEditBackupJob,
    isEditingBackupJob,
    editBackupJobErrorMessage,
  }
}
