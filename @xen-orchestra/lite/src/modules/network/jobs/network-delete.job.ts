import { networksArg } from '@/modules/network/jobs/network-delete-args.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useNetworkDeleteJob = defineJob('network.delete', [networksArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { records: vifs } = useVifStore().subscribe()
  const { getPifsByNetworkRef } = usePifStore().subscribe()

  return {
    run: networks => xapi.network.delete(networks.map(network => network.$ref)),
    validate: (isRunning, networks) => {
      if (networks.length === 0) {
        throw new JobError(t('job:network-delete:missing-network'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      const nPhysicalPifConnected = networks.reduce(
        (count, network) => count + getPifsByNetworkRef(network.$ref).filter(pif => pif.physical).length,
        0
      )

      if (nPhysicalPifConnected > 0) {
        throw new JobError(t('job:network-delete:has-n-physical-pif-connected', { n: nPhysicalPifConnected }))
      }

      const networkRefs = networks.map(network => network.$ref)
      const nAttachedVif = vifs.value.filter(vif => networkRefs.includes(vif.network) && vif.currently_attached).length

      if (nAttachedVif > 0) {
        throw new JobError(t('job:network-delete:has-n-vif-attached', { n: nAttachedVif }))
      }
    },
  }
})
