import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const NETWORK_DELETE_ERROR = {
  VIFS_IN_USE: 'vifs-in-use',
}

const payloadsArg = defineJobArg({
  identify: (network: FrontXoNetwork) => network.id,
  toArray: true,
})

export const useXoNetworkDeleteJob = defineJob('network.delete', [payloadsArg], () => {
  const { t } = useI18n()
  const { getPifsByNetworkId } = useXoPifCollection()
  const { vifs } = useXoVifCollection()

  return {
    async run(networks: FrontXoNetwork[]) {
      const results = await Promise.allSettled(
        networks.map(async network => {
          return await fetchDelete(`networks/${network.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete network ${networks[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate(isRunning, networks: FrontXoNetwork[]) {
      if (!networks || networks.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      const nPhysicalPif = networks.reduce(
        (count, network) =>
          count + (network.isBonded ? 0 : getPifsByNetworkId(network.id).filter(pif => pif.physical).length),
        0
      )

      if (nPhysicalPif > 0) {
        throw new JobError(t('job:network-delete:has-n-physical-pif-connected', { n: nPhysicalPif }))
      }

      const nAttachedVif = networks.reduce(
        (count, network) =>
          count + (network.isBonded ? 0 : vifs.value.filter(vif => vif.$network === network.id && vif.attached).length),
        0
      )

      if (nAttachedVif > 0) {
        throw new JobError(
          t('job:network-delete:has-n-vif-attached', { n: nAttachedVif }),
          NETWORK_DELETE_ERROR.VIFS_IN_USE
        )
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
