import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { payloadsArg } from '@/modules/network/jobs/network-create-args.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type BaseNewNetworkPayload = {
  name: string
  description?: string
  mtu?: number
  nbd?: boolean
}

export type NewNetworkPayload = BaseNewNetworkPayload & {
  pifRef: XenApiPif['$ref']
  vlan: number
}

export const useNetworkCreateJob = defineJob('network.create', [payloadsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XenApiNetwork['uuid']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const networkRef = await xapi.network.create({
            nameLabel: payload.name,
            nameDescription: payload.description,
            mtu: payload.mtu,
            vlan: payload.vlan,
            pifRef: payload.pifRef,
            nbd: payload.nbd,
          })

          return xapi.getField<XenApiNetwork['uuid']>('network', networkRef, 'uuid')
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
        if (payload.name.length === 0) {
          throw new JobError(t('job:arg:name-required'))
        }

        if (payload.pifRef === undefined) {
          throw new JobError(t('job:arg:pif-id-required'))
        }

        if (payload.vlan === undefined) {
          throw new JobError(t('job:arg:vlan-required'))
        }
      })
    },
  }
})
