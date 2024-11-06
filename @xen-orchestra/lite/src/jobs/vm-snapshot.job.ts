import { vmsArg } from '@/jobs/args'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVmSnapshotJob = defineJob('vm.snapshot', [vmsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vms => {
      const vmRefsToSnapshot = Object.fromEntries(
        vms.map(vm => [vm.$ref, `${vm.name_label}_${new Date().toISOString()}`])
      )

      return xapi.vm.snapshot(vmRefsToSnapshot)
    },
    validate: (isRunning, vms) => {
      if (vms.length === 0) {
        throw new JobError(t('job.vm-snapshot.missing-vms'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.SNAPSHOT))) {
        throw new JobRunningError(t('job.vm-snapshot.in-progress'))
      }
    },
  }
})
