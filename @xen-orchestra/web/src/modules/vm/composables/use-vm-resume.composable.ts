import { useXoVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
import { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmsAllowingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmResume(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)

  const { t } = useI18n()

  const pausedVms = computed(() => getVmsAllowingOperation(vms.value, VM_OPERATIONS.UNPAUSE))

  const suspendedVms = computed(() => getVmsAllowingOperation(vms.value, VM_OPERATIONS.RESUME))

  const {
    run: unpause,
    canRun: canUnpause,
    isRunning: isUnpausing,
    errorMessage: unpauseErrorMessage,
  } = useXoVmUnpauseJob(pausedVms)

  const {
    run: resume,
    canRun: canResume,
    isRunning: isResuming,
    errorMessage: resumeErrorMessage,
  } = useXoVmResumeJob(suspendedVms)

  const resumeVmsErrorMessage = computed(() => {
    if (pausedVms.value.length === 0 && suspendedVms.value.length === 0) {
      return t('job:vm-resume:missing-vm')
    }

    if (pausedVms.value.length > 0 && !canUnpause.value) {
      return unpauseErrorMessage.value
    }

    if (suspendedVms.value.length > 0 && !canResume.value) {
      return resumeErrorMessage.value
    }

    return undefined
  })

  const canResumeVms = computed(() => resumeVmsErrorMessage.value === undefined)

  const isResumingVms = computed(() => isUnpausing.value || isResuming.value)

  function resumeVms() {
    if (pausedVms.value.length > 0) {
      unpause()
    }

    if (suspendedVms.value.length > 0) {
      resume()
    }
  }

  return {
    resumeVms,
    canResumeVms,
    isResumingVms,
    resumeVmsErrorMessage,
  }
}
