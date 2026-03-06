import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { areVmsOperationPending, notAllVmsHavingPowerState } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmForceShutdownJob = defineJob('vm.force-shutdown', [xoVmsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: FrontXoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/hard_shutdown`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to force shutdown VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vms: FrontXoVm[]) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-force-shutdown:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, VM_OPERATIONS.HARD_SHUTDOWN)) {
        throw new JobRunningError(t('job:vm-force-shutdown:in-progress'))
      }

      if (notAllVmsHavingPowerState(vms, [VM_POWER_STATE.RUNNING, VM_POWER_STATE.SUSPENDED, VM_POWER_STATE.PAUSED])) {
        throw new JobError(t('job:vm-force-shutdown:bad-power-state'))
      }

      if (vms.some(vm => vm.blockedOperations.hard_shutdown)) {
        throw new JobError(t('job:vm-shutdown:blocked-operation'))
      }
    },
  }
})
