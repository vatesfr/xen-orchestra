import { xoHostArg } from '@/modules/host/jobs/xo-host-args.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { HOST_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoHostScanPifsJob = defineJob('host.scan-pifs', [xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(host: FrontXoHost) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`hosts/${host.id}/actions/scan_pifs`)

      await monitorTask(taskId)
    },

    validate: (isRunning, host: FrontXoHost | undefined) => {
      if (!host) {
        throw new JobError(t('job:host-scan-pifs:missing-host'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:host-scan-pifs:in-progress'))
      }

      if (host.power_state !== HOST_POWER_STATE.RUNNING) {
        throw new JobError(t('job:host-scan-pifs:bad-power-state'))
      }
    },
  }
})
