import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import { vifsArg } from '@/modules/vif/jobs/vif-args.ts'
import { vmArg } from '@/modules/vm/jobs/vm-args.ts'
import { areVmToolsDetected } from '@/modules/vm/utils/vm.util.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVifDisconnectJob = defineJob('vif.disconnect', [vifsArg, vmArg], () => {
  const { t } = useI18n()
  const { getByOpaqueRef: getGuestMetrics } = useVmGuestMetricsStore().subscribe()

  const xapi = useXenApiStore().getXapi()

  return {
    async run(vifs) {
      const results = await Promise.allSettled(vifs.map(vif => xapi.vif.unplug(vif.$ref)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to disconnect VIF ${vifs[index].uuid}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vifs, vm) => {
      if (vifs.length === 0) {
        throw new JobError(t('job:vif-disconnect:missing-vif'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:disconnect:in-progress'))
      }

      if (vifs.some(vif => !vif.currently_attached)) {
        throw new JobError(t('job:vif-disconnect:vif-disconnected'))
      }

      if (!vm || vm.power_state !== VM_POWER_STATE.RUNNING) {
        throw new JobError(t('job:vm-not-running'))
      }

      if (!areVmToolsDetected(getGuestMetrics(vm.guest_metrics))) {
        throw new JobError(t('vm-tools-missing'))
      }
    },
  }
})
