import { vmsArg } from '@/jobs/args.ts'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

export const useVmResumeJob = defineJob('vm.resume', [vmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms: XoVm[]) {
      await Promise.all(
        vms.map(async vm => {
          const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/resume?sync=true`, {
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
        throw new JobError(t('job.vm-resume.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.RESUME))) {
        throw new JobRunningError(t('job.vm-resume.in-progress'))
      }

      if (vms.some(vm => vm.power_state !== VM_POWER_STATE.SUSPENDED)) {
        throw new JobError(t('job.vm-resume.bad-power-state'))
      }
    },
  }
})
