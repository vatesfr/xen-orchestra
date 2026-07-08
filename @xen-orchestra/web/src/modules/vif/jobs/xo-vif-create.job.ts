import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { payloadArg } from '@/modules/vif/jobs/xo-vif-create-args.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { VIF_LOCKING_MODE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type BaseVifPayload = {
  MAC?: string
  ipv4_allowed?: string[]
  ipv6_allowed?: string[]
  locking_mode?: VIF_LOCKING_MODE
  qos_algorithm_type?: string
  qos_algorithm_params?: Record<string, string>
  other_config: Record<string, string>
}

export type NewVifPayload = BaseVifPayload & {
  vmId: FrontXoVm['id']
  networkId: FrontXoNetwork['id']
}

export const useXoVifCreateJob = defineJob('vif.create', [payloadArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<FrontXoVif['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: FrontXoVif['id'] }>('vifs', payload)
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
    },
  }
})
