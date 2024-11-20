import { vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmCopyJob = defineJob('vm.copy', [vmsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vms => {
      const vmRefsToClone = Object.fromEntries(vms.map(vm => [vm.$ref, `${vm.name_label} (COPY)`]))

      return xapi.vm.clone(vmRefsToClone)
    },
    validate: (isRunning, vms) => {
      if (vms.length === 0) {
        throw new JobError(t('job.vm-copy.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.CLONE))) {
        throw new JobRunningError(t('job.vm-copy.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job.vm-copy.bad-power-state'))
      }
    },
  }
})
