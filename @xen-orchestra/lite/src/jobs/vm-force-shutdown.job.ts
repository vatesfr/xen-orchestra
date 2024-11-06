import { vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmForceShutdownJob = defineJob('vm.force-shutdown', [vmsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vms =>
      xapi.vm.shutdown(
        vms.map(vm => vm.$ref),
        true
      ),
    validate: (isRunning, vms) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job.vm-force-shutdown.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.HARD_SHUTDOWN))) {
        throw new JobRunningError(t('job.vm-force-shutdown.in-progress'))
      }

      if (
        !vms.every(
          vm =>
            vm.power_state === VM_POWER_STATE.RUNNING ||
            vm.power_state === VM_POWER_STATE.SUSPENDED ||
            vm.power_state === VM_POWER_STATE.PAUSED
        )
      ) {
        throw new JobError(t('job.vm-force-shutdown.bad-power-state'))
      }
    },
  }
})
