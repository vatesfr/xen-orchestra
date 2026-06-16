import { xoVmsArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VmMigratePayloadByVmId } from '@/modules/vm/types/vm-migrate.type.ts'
import { areVmsOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { VM_OPERATIONS, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const vmMigratePayloadsArg = defineJobArg<VmMigratePayloadByVmId | undefined>({
  identify: () => null,
  toArray: false,
})

export const useXoVmMigrateJob = defineJob('vm.migrate', [xoVmsArg, vmMigratePayloadsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vms: FrontXoVm[], payloads: VmMigratePayloadByVmId | undefined) {
      const results = await Promise.allSettled(
        vms.map(async vm => {
          const payload = payloads?.[vm.id]

          if (payload === undefined) {
            throw new Error(`No migration payload for VM ${vm.id}`)
          }

          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/migrate`, payload)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to migrate VM ${vms[index].name_label}:`, result.reason)
        }
      })

      return results
    },

    validate(isRunning, vms?: FrontXoVm[], payloads?: VmMigratePayloadByVmId) {
      if (!vms || vms.length === 0) {
        throw new JobError(t('job:vm-migrate:missing-vm'))
      }

      if (isRunning || areVmsOperationPending(vms, [VM_OPERATIONS.POOL_MIGRATE, VM_OPERATIONS.MIGRATE_SEND])) {
        throw new JobRunningError(t('job:vm-migrate:in-progress'))
      }

      if (
        vms.some(
          vm => vm.blockedOperations[VM_OPERATIONS.POOL_MIGRATE] || vm.blockedOperations[VM_OPERATIONS.MIGRATE_SEND]
        )
      ) {
        throw new JobError(t('this-vm-cant-be-migrated'))
      }

      if (payloads === undefined || vms.some(vm => payloads[vm.id]?.hostId === undefined)) {
        throw new JobError(t('job:vm-migrate:missing-host'))
      }
    },
  }
})
