import { type EditBackupJobPayload, useXoBackupJobEditJob } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useEditBackupJob(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { schedulesByJobId } = useXoScheduleCollection()

  const schedule = computed(() => schedulesByJobId.value.get(backupJob.value.id)?.[0])

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

  function editBackupJob() {
    if (schedule.value === undefined) {
      return
    }

    return open({ props: { backupJob: backupJob.value, schedule: schedule.value } })
  }

  return {
    editBackupJob,
    canEditBackupJob,
    isEditingBackupJob,
    editBackupJobErrorMessage,
  }
}
