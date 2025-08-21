import { hostArg, vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useVmStartOnJob = defineJob('vm.start-on', [vmsArg, hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: (vms, host) =>
      xapi.vm.startOn(
        vms.map(vm => vm.$ref),
        host.$ref
      ),
    validate: (isRunning, vms, host) => {
      if (vms.length === 0) {
        throw new JobError(t('job.vm-start-on.missing-vms'))
      }

      if (!host) {
        throw new JobError(t('job.vm-start-on.missing-host'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATIONS.START_ON))) {
        throw new JobRunningError(t('job.vm-start-on.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job.vm-start-on.bad-power-state'))
      }
    },
  }
})
