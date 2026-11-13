import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { areVmsOperationPending, notAllVmsAllowingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmSuspendJob = defineJob('vm.suspend', [xoVmsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: FrontXoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/suspend`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to suspend VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vms: FrontXoVm[]) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-suspend:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, VM_OPERATIONS.SUSPEND)) {
        throw new JobRunningError(t('job:vm-suspend:in-progress'))
      }

      if (notAllVmsAllowingOperation(vms, VM_OPERATIONS.SUSPEND)) {
        throw new JobError(t('job:vm-suspend:bad-power-state'))
      }

      if (vms.some(vm => vm.blockedOperations.suspend)) {
        throw new JobError(t('job:vm-suspend:blocked-operation'))
      }
    },
  }
})
