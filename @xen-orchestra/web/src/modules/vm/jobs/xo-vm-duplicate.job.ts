import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { areVmsOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type DuplicateVmPayload =
  | { name_label: string; fast: true }
  | { name_label: string; srId: FrontXoSr['id']; compress?: 'gzip' | 'zstd' }

const payloadArg = defineJobArg<DuplicateVmPayload>({
  identify: false,
  toArray: false,
})

export const useXoVmDuplicateJob = defineJob('vm.duplicate', [xoVmsArg, payloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: FrontXoVm[], payload: DuplicateVmPayload) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`vms/${vm.id}/actions/clone`, payload)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to duplicate VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate(isRunning, vms?: FrontXoVm[]) {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-copy:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, [VM_OPERATIONS.CLONE, VM_OPERATIONS.COPY])) {
        throw new JobRunningError(t('job:vm-copy:in-progress'))
      }
    },
  }
})
