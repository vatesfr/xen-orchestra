import { xoHostArg } from '@/modules/host/jobs/xo-host-args.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { isPoolOperationPending } from '@/modules/pool/utils/xo-pool.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { POOL_ALLOWED_OPERATIONS } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoHostDetachJob = defineJob('host.detach', [xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()
  const { getPoolById } = useXoPoolCollection()

  return {
    async run(host: FrontXoHost) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`hosts/${host.id}/actions/detach`)
      await monitorTask(taskId)
    },

    validate: (isRunning, host: FrontXoHost | undefined) => {
      if (!host) {
        throw new JobError(t('job:host-detach:missing-host'))
      }

      const pool = getPoolById(host.$pool)

      if (isRunning || (pool && isPoolOperationPending(pool, POOL_ALLOWED_OPERATIONS.EJECT))) {
        throw new JobRunningError(t('job:host-detach:in-progress'))
      }

      if (pool?.master === host.id) {
        throw new JobError(t('job:host-detach:master-host'))
      }
    },
  }
})
