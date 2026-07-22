import { xoHostArg } from '@/modules/host/jobs/xo-host-args.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { isHostOperationPending } from '@/modules/host/utils/xo-host.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { HOST_ALLOWED_OPERATIONS, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoHostEnableJob = defineJob('host.enable', [xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(host: FrontXoHost | undefined) {
      if (!host) {
        return
      }
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`hosts/${host.id}/actions/enable`)
      await monitorTask(taskId)
    },

    validate: (isRunning, host: FrontXoHost | undefined) => {
      if (!host) {
        throw new JobError(t('job:host-enable:missing-host'))
      }

      if (isRunning || isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.ENABLE)) {
        throw new JobRunningError(t('job:enable:in-progress'))
      }
    },
  }
})
