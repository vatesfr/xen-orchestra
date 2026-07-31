import { xoHostArg } from '@/modules/host/jobs/xo-host-args.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { isHostOperationPending } from '@/modules/host/utils/xo-host.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { areVmsOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE, VM_OPERATIONS, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoHostSmartRebootJob = defineJob('host.smart-reboot', [xoHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()
  const { vmsByHost } = useXoVmCollection()

  return {
    async run(host: FrontXoHost) {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`hosts/${host.id}/actions/smart_reboot`)
      await monitorTask(taskId)
    },

    validate: (isRunning, host: FrontXoHost | undefined) => {
      if (!host) {
        throw new JobError(t('job:host-smart-reboot:missing-host'))
      }

      const residentVms = vmsByHost.value.get(host.id) ?? []

      if (
        isRunning ||
        areVmsOperationPending(residentVms, VM_OPERATIONS.SUSPEND) ||
        isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.REBOOT)
      ) {
        throw new JobRunningError(t('job:host-smart-reboot:in-progress'))
      }

      if (host.power_state !== HOST_POWER_STATE.RUNNING) {
        throw new JobError(t('job:host-smart-reboot:bad-power-state'))
      }
    },
  }
})
