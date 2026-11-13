import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useVdfPlacementOverride } from '@/modules/vdf/composables/vdf-placement.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmMigrationBlocked, isVmOperationPending, MIGRATION_OPERATIONS } from '@/modules/vm/utils/xo-vm.util.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE, type XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const xoVmMigratePayloadArg = defineJobArg<VmMigratePayload | undefined>({
  identify: false,
  toArray: false,
})

export const useXoVmMigrateJob = defineJob('vm.migrate', [xoVmArg, xoVmMigratePayloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()
  const { getHostById } = useXoHostCollection()
  // vdf#141: refused by the firewall, who may goes on without it
  const { placeWithOverride } = useVdfPlacementOverride()

  return {
    async run(vm: FrontXoVm, payload: VmMigratePayload | undefined) {
      if (payload === undefined) {
        throw new JobError(t('job:vm-migrate:missing-host'))
      }

      const { taskId } = await placeWithOverride(bypassFirewallCheck =>
        fetchPost<{ taskId: XoTask['id'] }>(
          `vms/${vm.id}/actions/migrate`,
          bypassFirewallCheck ? { ...payload, bypassFirewallCheck } : payload
        )
      )

      await monitorTask(taskId)
    },

    validate: (isRunning, vm: FrontXoVm | undefined, payload: VmMigratePayload | undefined) => {
      if (vm === undefined) {
        throw new JobError(t('job:vm-migrate:missing-vm'))
      }

      if (isRunning || isVmOperationPending(vm, MIGRATION_OPERATIONS)) {
        throw new JobRunningError(t('job:vm-migrate:in-progress'))
      }

      if (vm.power_state === VM_POWER_STATE.PAUSED) {
        throw new JobError(t('job:vm-migrate:paused'))
      }

      if (isVmMigrationBlocked(vm)) {
        throw new JobError(t('job:vm-migrate:blocked-operation'))
      }

      if (payload === undefined) {
        return
      }

      if (getHostById(payload.hostId) === undefined) {
        throw new JobError(t('job:vm-migrate:missing-host'))
      }
    },
  }
})
