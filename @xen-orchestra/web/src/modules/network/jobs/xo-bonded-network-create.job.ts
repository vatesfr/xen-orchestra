import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable'
import { fetchPost } from '@/shared/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { BOND_MODE, XoNetwork, XoPif, XoPool, XoTask } from '@vates/types'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Payload that the REST API expects
export type NewBondedNetworkPayload = {
  poolId: XoPool['id']
  pifIds: XoPif['id'][]
  name: string
  bondMode: BOND_MODE
  description?: string
  mtu?: number
  nbd?: boolean
}

const payloadsArg = defineJobArg<Ref<NewBondedNetworkPayload>>({
  identify: payload => payload.value.poolId,
  toArray: true,
})

export const useXoBondedNetworkCreateJob = defineJob('bonded-network.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoNetwork['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { poolId, ...rest } = payload.value
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
            `pools/${poolId}/actions/create_bonded_network`,
            rest
          )
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
        const { value } = payload

        if (value.poolId === undefined) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (value.name.length === 0) {
          throw new JobError(t('job:arg:name-required'))
        }

        if (value.pifIds === undefined || value.pifIds.length === 0) {
          throw new JobError(t('job:arg:pif-ids-required'))
        }

        if (value.bondMode === undefined) {
          throw new JobError(t('job:arg:bond-mode-required'))
        }
      })
    },
  }
})
