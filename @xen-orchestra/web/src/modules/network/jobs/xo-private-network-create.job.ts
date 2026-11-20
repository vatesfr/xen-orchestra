import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { TUNNEL_PROTOCOL } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type NewPrivateNetworkPayload = {
  poolIds: FrontXoPool['id'][]
  pifIds: FrontXoPif['id'][]
  name: string
  description: string
  encapsulation: TUNNEL_PROTOCOL
  encrypted?: boolean
  mtu?: number
  preferredCenterId?: FrontXoHost['id']
}

const payloadsArg = defineJobArg<NewPrivateNetworkPayload>({
  identify: payload => payload.poolIds.join(','),
  toArray: true,
})

export const useXoPrivateNetworkCreateJob = defineJob('private-network.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<FrontXoNetwork['id'][]>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
            'plugins/sdn-controller/pools/actions/create_private_network',
            payload
          )
          const { networkIds } = await monitorTask<{ networkIds: FrontXoNetwork['id'][] }>(taskId)

          return networkIds
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
        if (payload.poolIds.length === 0) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (payload.pifIds.length !== payload.poolIds.length) {
          throw new JobError(t('job:arg:pif-per-pool-required'))
        }

        if (payload.name.length === 0) {
          throw new JobError(t('job:arg:name-required'))
        }

        if (payload.encapsulation === undefined) {
          throw new JobError(t('job:arg:encapsulation-required'))
        }
      })
    },
  }
})
