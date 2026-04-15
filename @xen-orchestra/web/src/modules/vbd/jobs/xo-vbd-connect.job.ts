import { xoVbdsArg } from '@/modules/vbd/jobs/xo-vbd-args.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVbdConnectJob = defineJob('vbd.connect', [xoVbdsArg, xoVmArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vbds: FrontXoVbd[]) {
      const results = await Promise.allSettled(
        vbds.map(async vbd => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vbds/${vbd.id}/actions/connect`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to connect VBD ${vbds[index].id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vbds: FrontXoVbd[], vm: FrontXoVm | undefined) => {
      if (!vbds || vbds.length === 0) {
        throw new JobError(t('job:vbd-connect:missing-vbd'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:connect:in-progress'))
      }

      if (vbds.some(vbd => vbd.attached)) {
        throw new JobError(t('job:vbd-connect:vbd-already-connected'))
      }

      if (!vm || vm.power_state !== VM_POWER_STATE.RUNNING) {
        throw new JobError(t('job:vm-not-running'))
      }

      if (!vm.managementAgentDetected || !vm.pvDriversDetected) {
        throw new JobError(t('job:no-guest-tools'))
      }
    },
  }
})
