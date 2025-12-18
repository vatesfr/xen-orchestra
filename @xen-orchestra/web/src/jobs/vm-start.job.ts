import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { vmsArg } from './args'

async function startVm(vm: XoVm): Promise<void> {
  const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/start?async=true`, {
    method: 'POST',
  }).json()

  if (error.value) {
    throw new Error(error.value.message)
  }
}

export const useVmStartJob = defineJob('vm.start', [vmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms) {
      for (const vm of vms) {
        await startVm(vm)
      }
    },

    validate(isRunning, vms) {
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
