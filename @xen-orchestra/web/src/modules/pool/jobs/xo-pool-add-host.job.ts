import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type PoolAddHostPayload = {
  poolId: FrontXoPool['id']
  hostId: FrontXoHost['id']
}

const payloadArg = defineJobArg<PoolAddHostPayload>({
  identify: payload => payload.hostId,
  toArray: true,
})

export const useXoPoolAddHostJob = defineJob('pool.add-host', [payloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    run(payloads) {
      return Promise.allSettled(
        payloads.map(async ({ poolId, hostId }) => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pools/${poolId}/actions/add_host`, {
            host: hostId,
            force: true,
          })
          await monitorTask(taskId)
        })
      )
    },
    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:pool-add-host:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        if (payload.poolId === undefined) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (payload.hostId === undefined) {
          throw new JobError(t('job:arg:host-required'))
        }
      })
    },
  }
})
