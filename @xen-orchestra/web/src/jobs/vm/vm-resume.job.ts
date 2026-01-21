import { useXoTaskUtils } from '@/composables/xo-task-utils.composable.ts'
import { vmsArg } from '@/jobs/args.job.ts'
import { fetchPost } from '@/utils/fetch.util.ts'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoTask, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useVmResumeJob = defineJob('vm.resume', [vmsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: XoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/resume`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to resume VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vms: XoVm[]) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-resume:missing-vm'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.RESUME))) {
        throw new JobRunningError(t('job:vm-resume:in-progress'))
      }

      if (vms.some(vm => vm.power_state !== VM_POWER_STATE.SUSPENDED)) {
        throw new JobError(t('job:vm-resume:bad-power-state'))
      }
    },
  }
})
