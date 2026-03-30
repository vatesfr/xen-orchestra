import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable'
import { fetchPost } from '@/shared/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoNetwork, XoPif, XoPool, XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

// Payload that the REST API expects
export type NewNetworkPayload = {
  poolId: XoPool['id']
  pif: XoPif['id']
  name: string
  vlan: number
  description?: string
  mtu?: number
  nbd?: boolean
}

const payloadsArg = defineJobArg<NewNetworkPayload>({
  identify: payload => payload.poolId,
  toArray: true,
})

export const useXoNetworkCreateJob = defineJob('network.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoNetwork['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { poolId, ...rest } = payload
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pools/${poolId}/actions/create_network`, rest)
          const { id } = await monitorTask<{ id: XoNetwork['id'] }>(taskId)

          return id
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        if (payload.poolId === undefined) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (payload.name.length === 0) {
          throw new JobError(t('job:arg:name-required'))
        }

        if (payload.pif === undefined) {
          throw new JobError(t('job:arg:pif-id-required'))
        }

        if (payload.vlan === undefined) {
          throw new JobError(t('job:arg:vlan-required'))
        }
      })
    },
  }
})
