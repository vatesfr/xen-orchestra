import { vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmShutdownJob = defineJob('vm.shutdown', [vmsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vms => xapi.vm.shutdown(vms.map(vm => vm.$ref)),
    validate: (isRunning, vms) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job.vm-shutdown.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.CLEAN_SHUTDOWN))) {
        throw new JobRunningError(t('job.vm-shutdown.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.RUNNING)) {
        throw new JobError(t('job.vm-shutdown.bad-power-state'))
      }
    },
  }
})
