import { hostArg, vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import i18n from '@core/i18n'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'

export const useVmStartOnJob = defineJob('vm.start-on', [vmsArg, hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = i18n.global

  return {
    run: (vms, host) =>
      xapi.vm.startOn(
        vms.map(vm => vm.$ref),
        host.$ref
      ),
    validate: (isRunning, vms, host) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job.vm-start-on.missing-vms'))
      }

      if (!host) {
        throw new JobError(t('job.vm-start-on.missing-host'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.START_ON))) {
        throw new JobRunningError(t('job.vm-start-on.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job.vm-start-on.bad-power-state'))
      }
    },
  }
})
