import { useXoTaskUtils } from '@/composables/xo-task-utils.composable'
import { vmsArg } from '@/jobs/args'
import { fetchPost } from '@/utils/fetch.util'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoTask, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useVmStartJob = defineJob('vm.start', [vmsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: XoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`/rest/v0/vms/${vm.id}/actions/start`)
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

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.START))) {
        throw new JobRunningError(t('job:vm-start:in-progress'))
      }

      if (vms.some(vm => vm.power_state !== VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job:vm-start:bad-power-state'))
      }
    },
  }
})
