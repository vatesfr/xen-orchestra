import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { areVmsOperationPending, notAllVmsHavingPowerState } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoTask, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmStartJob = defineJob('vm.start', [xoVmsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: XoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/start`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to start VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate(isRunning, vms?: XoVm[]) {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-start:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, VM_OPERATIONS.START)) {
        throw new JobRunningError(t('job:vm-start:in-progress'))
      }

      if (notAllVmsHavingPowerState(vms, [VM_POWER_STATE.HALTED])) {
        throw new JobError(t('job:vm-start:bad-power-state'))
      }
    },
  }
})
