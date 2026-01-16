import { vmsArg } from '@/jobs/args.ts'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

export const useVmPauseJob = defineJob('vm.pause', [vmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms: XoVm[]) {
      await Promise.all(
        vms.map(async vm => {
          const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/pause?sync=true`, {
            method: 'POST',
          })

          if (error.value) {
            throw new Error(error.value.message)
          }
        })
      )
    },

    validate: (isRunning, vms: XoVm[]) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job.vm-pause.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.PAUSE))) {
        throw new JobRunningError(t('job.vm-pause.in-progress'))
      }

      if (vms.some(vm => vm.power_state !== VM_POWER_STATE.RUNNING)) {
        throw new JobError(t('job.vm-pause.bad-power-state'))
      }
    },
  }
})
