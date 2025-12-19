import { vmsArg } from '@/jobs/args'
import { startVm } from '@/jobs/vm/vm-start.job'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useJobVmStart = defineJob('vm.start', [vmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms: XoVm[]) {
      await startVm(vms)
    },

    validate(isRunning, vms: XoVm[]) {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job.vm-start.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.START))) {
        throw new JobRunningError(t('job.vm-start.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job.vm-start.bad-power-state'))
      }
    },
  }
})
