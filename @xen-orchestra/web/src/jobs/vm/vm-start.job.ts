import { vmsArg } from '@/jobs/args'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

export const useVmStartJob = defineJob('vm.start', [vmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms: XoVm[]) {
      await Promise.allSettled(
        vms.map(async vm => {
          const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/start?sync=false`, { method: 'POST' }).json()

          if (error.value) {
            throw new Error(error.value.message)
          }
        })
      )
    },

    validate(isRunning, vms?: XoVm[]) {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-start:missing-vm'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.START))) {
        throw new JobRunningError(t('job:vm-start:in-progress'))
      }

      if (vms.some(vm => vm.power_state !== VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job:vm-start:bad-power-state'))
      }
    },
  }
})
