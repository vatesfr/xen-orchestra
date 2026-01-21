import { useXoTaskUtils } from '@/composables/xo-task-utils.composable.ts'
import { vmsArg } from '@/jobs/args.job.ts'
import { fetchPost } from '@/utils/fetch.util.ts'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoTask, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useVmRebootJob = defineJob('vm.reboot', [vmsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: XoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/clean_reboot`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to reboot VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vms: XoVm[]) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-reboot:missing-vm'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.CLEAN_REBOOT))) {
        throw new JobRunningError(t('job:vm-reboot:in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.RUNNING || vm.power_state === VM_POWER_STATE.PAUSED)) {
        throw new JobError(t('job:vm-reboot:bad-power-state'))
      }
    },
  }
})
