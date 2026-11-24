import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type PoolAddHostPayload = {
  hostId: FrontXoHost['id']
}

const poolIdArg = defineJobArg<FrontXoPool['id']>({
  identify: true,
  toArray: false,
})

const payloadArg = defineJobArg<PoolAddHostPayload>({
  identify: false,
  toArray: false,
})

export const useXoPoolAddHostJob = defineJob('pool.add-host', [poolIdArg, payloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(poolId: FrontXoPool['id'], { hostId }: PoolAddHostPayload) {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pools/${poolId}/actions/add_host`, {
        host: hostId,
        force: true,
      })

      await monitorTask(taskId)
    },
    validate(isRunning, poolId: FrontXoPool['id'] | undefined, payload: PoolAddHostPayload | undefined) {
      if (poolId === undefined) {
        throw new JobError(t('job:arg:pool-id-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pool-add-host:in-progress'))
      }

      // The payload only exists once the drawer is confirmed
      if (payload === undefined) {
        return
      }

      if (payload.hostId === undefined) {
        throw new JobError(t('job:arg:host-required'))
      }
    },
  }
})
