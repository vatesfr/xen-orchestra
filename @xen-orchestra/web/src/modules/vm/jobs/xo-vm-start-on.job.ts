import { xoHostArg } from '@/modules/host/jobs/xo-host-args.jobs.ts'
import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { isVmOperatingPending } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, VM_POWER_STATE, type XoHost, type XoTask, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useVmStartOnJob = defineJob('vm.start-on', [xoVmsArg, xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: XoVm[], host: XoHost | undefined) {
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

    validate: (isRunning, vms: XoVm[], host: XoHost | undefined) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-start-on:missing-vm'))
      }

      if (isRunning || vms.some(vm => isVmOperatingPending(vm, VM_OPERATIONS.START_ON))) {
        throw new JobRunningError(t('job:vm-start-on:in-progress'))
      }

      if (!host) {
        throw new JobError(t('job:vm-start-on:missing-host'))
      }

      if (vms.some(vm => vm.power_state !== VM_POWER_STATE.HALTED)) {
        throw new JobError(t('job:vm-start-on:bad-power-state'))
      }
    },
  }
})
