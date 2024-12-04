import { vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmResumeJob = defineJob('vm.resume', [vmsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vms => xapi.vm.resume(Object.fromEntries(vms.map(vm => [vm.$ref, vm.power_state]))),
    validate: (isRunning, vms) => {
      if (vms.length === 0) {
        throw new JobError(t('job.vm-resume.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, [VM_OPERATION.UNPAUSE, VM_OPERATION.RESUME]))) {
        throw new JobRunningError(t('job.vm-resume.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.PAUSED || vm.power_state === VM_POWER_STATE.SUSPENDED)) {
        throw new JobError(t('job.vm-resume.bad-power-state'))
      }
    },
  }
})
