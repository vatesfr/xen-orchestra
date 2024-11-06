import { vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmDeleteJob = defineJob('vm.delete', [vmsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vms => xapi.vm.delete(vms.map(vm => vm.$ref)),
    validate: (isRunning, vms) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job.vm-delete.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.DESTROY))) {
        throw new JobRunningError(t('job.vm-delete.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job.vm-delete.bad-power-state'))
      }
    },
  }
})
