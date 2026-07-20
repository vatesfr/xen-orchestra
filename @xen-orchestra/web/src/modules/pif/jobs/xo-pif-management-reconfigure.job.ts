import { xoHostArg } from '@/modules/host/jobs/xo-host-args.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { xoPifArg } from '@/modules/pif/jobs/xo-pif-args.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoPifManagementReconfigureJob = defineJob('pif.management-reconfigure', [xoPifArg, xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(pif: FrontXoPif | undefined, host: FrontXoHost | undefined) {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`hosts/${host?.id}/actions/management_reconfigure`, {
        pif: pif?.id,
      })

      return monitorTask(taskId)
    },

    validate: (isRunning, pif: FrontXoPif | undefined, host: FrontXoHost | undefined) => {
      if (!pif || !host) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:management-reconfigure:in-progress'))
      }

      if (pif.management) {
        throw new JobError(t('job:pif-management-reconfigure:current-pif'))
      }

      if (!pif.ip && pif.ipv6.length === 0) {
        throw new JobError(t('job:pif-management-reconfigure:missing-ip'))
      }
    },
  }
})
