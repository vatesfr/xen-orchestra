import { useVmExport } from '@/composables/vm-export.composable.ts'
import { vmsArg } from '@/jobs/args'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm'
import { VM_COMPRESSION_TYPE, VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

const compressionArg = defineJobArg<VM_COMPRESSION_TYPE>({
  identify: false,
  toArray: false,
})

export const useVmExportJob = defineJob('vm.export', [vmsArg, compressionArg], () => {
  const { t } = useI18n()

  const { exportVms } = useVmExport()

  return {
    run: (vms, compression) =>
      exportVms(
        vms.map(vm => vm.$ref),
        compression
      ),
    validate: (isRunning, vms, compression) => {
      if (vms.length === 0) {
        throw new JobError(t('job:vm-export:missing-vm'))
      }

      if (!compression) {
        throw new JobError(t('job:vm-export:missing-compression'))
      }

      if (isRunning || vms.some(vm => isVmOperationPending(vm, VM_OPERATION.EXPORT))) {
        throw new JobRunningError(t('job:vm-export:in-progress'))
      }

      if (!vms.every(vm => areSomeVmOperationAllowed(vm, VM_OPERATION.EXPORT))) {
        throw new JobError(t('job:vm-export:not-allowed'))
      }
    },
  }
})
