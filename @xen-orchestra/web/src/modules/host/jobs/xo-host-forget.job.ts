import { xoHostArg } from '@/modules/host/jobs/xo-host-args.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { HOST_POWER_STATE, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoHostForgetJob = defineJob('host.forget', [xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(host: FrontXoHost | undefined) {
      if (host) {
        const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`hosts/${host.id}/actions/forget`)
        await monitorTask(taskId)
      }
    },

    validate: (isRunning, host: FrontXoHost | undefined) => {
      if (!host) {
        throw new JobError(t('job:host-forget:missing-host'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:host-forget:in-progress'))
      }

      if (host.power_state !== HOST_POWER_STATE.HALTED) {
        throw new JobError(t('job:host-forget:bad-power-state'))
      }
    },
  }
})
