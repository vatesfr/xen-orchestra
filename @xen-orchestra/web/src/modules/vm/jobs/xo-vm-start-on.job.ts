import { xoHostArg } from '@/modules/host/jobs/xo-host-args.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { areVmsOperationPending, notAllVmsHavingPowerState } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmStartOnJob = defineJob('vm.start-on', [xoVmsArg, xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: FrontXoVm[], host: FrontXoHost | undefined) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/start`, {
            hostId: host?.id,
          })
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

    validate: (isRunning, vms: FrontXoVm[], host: FrontXoHost | undefined) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-start-on:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, VM_OPERATIONS.START_ON)) {
        throw new JobRunningError(t('job:vm-start-on:in-progress'))
      }

      if (!host) {
        throw new JobError(t('job:vm-start-on:missing-host'))
      }

      if (notAllVmsHavingPowerState(vms, [VM_POWER_STATE.HALTED])) {
        throw new JobError(t('job:vm-start-on:bad-power-state'))
      }
    },
  }
})
