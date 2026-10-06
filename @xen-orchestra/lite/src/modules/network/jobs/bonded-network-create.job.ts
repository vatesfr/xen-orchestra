import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { payloadArg } from '@/modules/network/jobs/bonded-network-create-args.ts'
import type { BaseNewNetworkPayload } from '@/modules/network/jobs/network-create.job.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { BOND_MODE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type NewBondedNetworkPayload = BaseNewNetworkPayload & {
  pifRefs: XenApiPif['$ref'][]
  bondMode: BOND_MODE
}

export const useBondedNetworkCreateJob = defineJob('bonded-network.create', [payloadArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    async run(payload): Promise<XenApiNetwork['uuid']> {
      const networkRef = await xapi.network.createBonded({
        nameLabel: payload.name,
        nameDescription: payload.description,
        mtu: payload.mtu,
        pifRefs: payload.pifRefs,
        bondMode: payload.bondMode,
        nbd: payload.nbd,
      })

      return xapi.getField<XenApiNetwork['uuid']>('network', networkRef, 'uuid')
    },

    validate(isRunning, payload) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.name.length === 0) {
        throw new JobError(t('job:arg:name-required'))
      }

      if (payload.pifRefs.length === 0) {
        throw new JobError(t('job:arg:pif-ids-required'))
      }

      if (payload.bondMode === undefined) {
        throw new JobError(t('job:arg:bond-mode-required'))
      }
    },
  }
})
