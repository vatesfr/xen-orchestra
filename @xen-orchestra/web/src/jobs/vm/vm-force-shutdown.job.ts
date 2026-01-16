import { vmsArg } from '@/jobs/args.ts'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { useFetch } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

export const useVmForceShutdownJob = defineJob('vm.force-shutdown', [vmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms: XoVm[]) {
      await Promise.all(
        vms.map(async vm => {
          const { error } = await useFetch(`/rest/v0/vms/${vm.id}/actions/hard_shutdown?sync=true`, {
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
        throw new JobError(t('job.vm-force-shutdown.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.HARD_SHUTDOWN))) {
        throw new JobRunningError(t('job.vm-force-shutdown.in-progress'))
      }

      if (
        !vms.every(
          vm =>
            vm.power_state === VM_POWER_STATE.RUNNING ||
            vm.power_state === VM_POWER_STATE.SUSPENDED ||
            vm.power_state === VM_POWER_STATE.PAUSED
        )
      ) {
        throw new JobError(t('job.vm-force-shutdown.bad-power-state'))
      }
    },
  }
})
