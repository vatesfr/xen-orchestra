import { hostArg, vmsArg } from '@/jobs/args'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmMigrateJob = defineJob('vm.migrate', [vmsArg, hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: (vms, host) =>
      xapi.vm.migrate(
        vms.map(vm => vm.$ref),
        host.$ref
      ),
    validate: (isRunning, vms, host) => {
      if (vms.length === 0) {
        throw new JobError(t('job.vm-migrate.missing-vms'))
      }

      if (!host) {
        throw new JobError(t('job.vm-migrate.missing-host'))
      }

      if (
        isRunning ||
        vms.some(vm => isVmOperationPending(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND]))
      ) {
        throw new JobRunningError(t('job.vm-migrate.in-progress'))
      }

      if (!vms.every(vm => vm.power_state === VM_POWER_STATE.RUNNING)) {
        throw new JobError(t('job.vm-migrate.bad-power-state'))
      }

      if (!vms.every(vm => areSomeVmOperationAllowed(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND]))) {
        throw new JobError(t('job.vm-export.not-allowed'))
      }
    },
  }
})
