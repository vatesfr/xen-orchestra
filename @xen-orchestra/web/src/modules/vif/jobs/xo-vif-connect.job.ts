import { xoVifsArg } from '@/modules/vif/jobs/xo-vif-args.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVifConnectJob = defineJob('vif.connect', [xoVifsArg, xoVmArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vifs: FrontXoVif[]) {
      const results = await Promise.allSettled(
        vifs.map(async vif => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vifs/${vif.id}/actions/connect`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to connect VIF ${vifs[index].id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vifs: FrontXoVif[], vm: FrontXoVm | undefined) => {
      if (!vifs || vifs.length === 0) {
        throw new JobError(t('job:vif-connect:missing-vif'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:connect:in-progress'))
      }

      if (vifs.some(vif => vif.attached)) {
        throw new JobError(t('job:vif-connect:vif-already-connected'))
      }

      if (!vm || vm.power_state !== VM_POWER_STATE.RUNNING) {
        throw new JobError(t('job:vm-not-running'))
      }

      if (!vm.managementAgentDetected || !vm.pvDriversDetected) {
        throw new JobError(t('vm-tools-missing'))
      }
    },
  }
})
