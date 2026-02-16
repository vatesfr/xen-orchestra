import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { areVmsOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmDeleteJob = defineJob('vm.delete', [xoVmsArg], () => {
  const { t } = useI18n()

  return {
    async run(vms: FrontXoVm[]) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          return await fetchDelete(`vms/${vm.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vms: FrontXoVm[]) => {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-delete:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, VM_OPERATIONS.DESTROY)) {
        throw new JobRunningError(t('job:vm-delete:in-progress'))
      }

      if (vms.some(vm => vm.blockedOperations.destroy)) {
        throw new JobError(t('job:vm-delete:blocked-operation'))
      }
    },
  }
})
