import { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import { useXoVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
import { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import type { XoVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useXoVmJobRunning(vm: MaybeRefOrGetter<XoVm>) {
  const { isRunning: startRunning } = useXoVmStartJob(() => [toValue(vm)])
  const { isRunning: pauseRunning } = useXoVmPauseJob(() => [toValue(vm)])
  const { isRunning: unpauseRunning } = useXoVmUnpauseJob(() => [toValue(vm)])
  const { isRunning: suspendRunning } = useXoVmSuspendJob(() => [toValue(vm)])
  const { isRunning: resumeRunning } = useXoVmResumeJob(() => [toValue(vm)])
  const { isRunning: shutdownRunning } = useXoVmShutdownJob(() => [toValue(vm)])
  const { isRunning: rebootRunning } = useXoVmRebootJob(() => [toValue(vm)])
  const { isRunning: forceShutdownRunning } = useXoVmForceShutdownJob(() => [toValue(vm)])
  const { isRunning: forceRebootRunning } = useXoVmForceRebootJob(() => [toValue(vm)])

  const isAnyJobRunning = computed(
    () =>
      startRunning.value ||
      pauseRunning.value ||
      unpauseRunning.value ||
      suspendRunning.value ||
      resumeRunning.value ||
      shutdownRunning.value ||
      rebootRunning.value ||
      forceShutdownRunning.value ||
      forceRebootRunning.value
  )

  return {
    isAnyJobRunning,
  }
}
