import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
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

  function isNotRunningIntraPoolMigrationWithoutDisk(
    vm: FrontXoVm,
    targetHost: FrontXoHost,
    payload: VmMigratePayload
  ) {
    if (vm.power_state === VM_POWER_STATE.RUNNING) {
      return false
    }

    if (targetHost.$pool !== vm.$pool) {
      return false
    }

    if (payload.srIdByVdiId === undefined) {
      return true
    }

    return Object.keys(payload.srIdByVdiId).length === 0
  }

  return {
    async run(vm: FrontXoVm, payload: VmMigratePayload | undefined) {
      if (payload === undefined) {
        throw new JobError(t('job:vm-migrate:missing-host'))
      }

      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/migrate`, payload)

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

      const targetHost = getHostById(payload.hostId)

      if (targetHost === undefined) {
        throw new JobError(t('job:vm-migrate:missing-host'))
      }

      if (isNotRunningIntraPoolMigrationWithoutDisk(vm, targetHost, payload)) {
        throw new JobError(t('job:vm-migrate:not-running-requires-disk-migration'))
      }
    },
  }
})
