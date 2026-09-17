import { xoHostArg } from '@/modules/host/jobs/xo-host-args.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { isHostOperationPending } from '@/modules/host/utils/xo-host.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { HOST_POWER_STATE, HOST_ALLOWED_OPERATIONS } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoHostEmergencyShutdownJob = defineJob('host.emergency_shutdown', [xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(host: FrontXoHost) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`hosts/${host.id}/actions/emergency_shutdown`)
      await monitorTask(taskId)
    },

    validate: (isRunning, host: FrontXoHost | undefined) => {
      if (!host) {
        throw new JobError(t('job:host-shutdown:missing-host'))
      }

      if (isRunning || isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.SHUTDOWN)) {
        throw new JobRunningError(t('job:host-shutdown:in-progress'))
      }

      if (host.power_state !== HOST_POWER_STATE.RUNNING) {
        throw new JobError(t('job:host-shutdown:bad-power-state'))
      }
    },
  }
})
