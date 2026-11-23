import { useVmActionModal } from '@/modules/vm/composables/use-vm-action-modal.composable.ts'
import { useVmResume } from '@/modules/vm/composables/use-vm-resume.composable.ts'
import { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import {
  getVmsAllowingOperation,
  isVmMissingGuestToolsFor,
  type VmPowerStateOperation,
} from '@/modules/vm/utils/xo-vm.util.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmBulkPowerStateActions(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)

  const { t } = useI18n()

  const { openVmActionModal } = useVmActionModal()

  function useTargetedVms(operation: VmPowerStateOperation) {
    const candidateVms = computed(() => getVmsAllowingOperation(vms.value, operation))

    const targetedVms = computed(() => candidateVms.value.filter(vm => !isVmMissingGuestToolsFor(vm, operation)))

    const areGuestToolsMissing = computed(() => candidateVms.value.length > 0 && targetedVms.value.length === 0)

    const getHint = (errorMessage: string | undefined) =>
      areGuestToolsMissing.value ? t('vm-tools-missing') : errorMessage

    return { targetedVms, getHint }
  }

  const startableVms = useTargetedVms(VM_OPERATIONS.START)
  const pausableVms = useTargetedVms(VM_OPERATIONS.PAUSE)
  const suspendableVms = useTargetedVms(VM_OPERATIONS.SUSPEND)
  const rebootableVms = useTargetedVms(VM_OPERATIONS.CLEAN_REBOOT)
  const forceRebootableVms = useTargetedVms(VM_OPERATIONS.HARD_REBOOT)
  const shutdownableVms = useTargetedVms(VM_OPERATIONS.CLEAN_SHUTDOWN)
  const forceShutdownableVms = useTargetedVms(VM_OPERATIONS.HARD_SHUTDOWN)

  const {
    run: startVms,
    canRun: canStartVms,
    isRunning: isStartingVms,
    errorMessage: startVmsErrorMessage,
  } = useXoVmStartJob(startableVms.targetedVms)

  const {
    run: pauseVms,
    canRun: canPauseVms,
    isRunning: isPausingVms,
    errorMessage: pauseVmsErrorMessage,
  } = useXoVmPauseJob(pausableVms.targetedVms)

  const { resumeVms, canResumeVms, isResumingVms, resumeVmsErrorMessage } = useVmResume(vms)

  const {
    run: suspendVms,
    canRun: canSuspendVms,
    isRunning: isSuspendingVms,
    errorMessage: suspendVmsErrorMessage,
  } = useXoVmSuspendJob(suspendableVms.targetedVms)

  const {
    run: rebootVms,
    canRun: canRebootVms,
    isRunning: isRebootingVms,
    errorMessage: rebootVmsErrorMessage,
  } = useXoVmRebootJob(rebootableVms.targetedVms)

  const {
    run: forceRebootVms,
    canRun: canForceRebootVms,
    isRunning: isForceRebootingVms,
    errorMessage: forceRebootVmsErrorMessage,
  } = useXoVmForceRebootJob(forceRebootableVms.targetedVms)

  const {
    run: shutdownVms,
    canRun: canShutdownVms,
    isRunning: isShuttingDownVms,
    errorMessage: shutdownVmsErrorMessage,
  } = useXoVmShutdownJob(shutdownableVms.targetedVms)

  const {
    run: forceShutdownVms,
    canRun: canForceShutdownVms,
    isRunning: isForceShuttingDownVms,
    errorMessage: forceShutdownVmsErrorMessage,
  } = useXoVmForceShutdownJob(forceShutdownableVms.targetedVms)

  const powerStateActions = computed((): LeafActionItem[] => [
    {
      label: t('action:start'),
      icon: 'fa:play',
      onClick: () => startVms(),
      disabled: !canStartVms.value,
      busy: isStartingVms.value,
      hint: startVmsErrorMessage.value,
    },
    {
      label: t('pause'),
      icon: 'fa:pause',
      onClick: () => pauseVms(),
      disabled: !canPauseVms.value,
      busy: isPausingVms.value,
      hint: pauseVmsErrorMessage.value,
    },
    {
      label: t('action:resume'),
      icon: 'fa:play',
      onClick: () => resumeVms(),
      disabled: !canResumeVms.value,
      busy: isResumingVms.value,
      hint: resumeVmsErrorMessage.value,
    },
    {
      label: t('action:suspend'),
      icon: 'fa:moon',
      onClick: () => suspendVms(),
      disabled: !canSuspendVms.value,
      busy: isSuspendingVms.value,
      hint: suspendableVms.getHint(suspendVmsErrorMessage.value),
    },
    {
      label: t('action:reboot'),
      icon: 'action:reboot',
      onClick: () => openVmActionModal('reboot', rebootableVms.targetedVms.value, () => rebootVms({ detached: true })),
      disabled: !canRebootVms.value,
      busy: isRebootingVms.value,
      hint: rebootableVms.getHint(rebootVmsErrorMessage.value),
    },
    {
      label: t('action:force-reboot'),
      icon: 'action:force-reboot',
      onClick: () =>
        openVmActionModal('force-reboot', forceRebootableVms.targetedVms.value, () =>
          forceRebootVms({ detached: true })
        ),
      disabled: !canForceRebootVms.value,
      busy: isForceRebootingVms.value,
      hint: forceRebootVmsErrorMessage.value,
    },
    {
      label: t('action:shutdown'),
      icon: 'action:shutdown',
      onClick: () =>
        openVmActionModal('shutdown', shutdownableVms.targetedVms.value, () => shutdownVms({ detached: true })),
      disabled: !canShutdownVms.value,
      busy: isShuttingDownVms.value,
      hint: shutdownableVms.getHint(shutdownVmsErrorMessage.value),
    },
    {
      label: t('action:force-shutdown'),
      icon: 'action:force-shutdown',
      onClick: () =>
        openVmActionModal('force-shutdown', forceShutdownableVms.targetedVms.value, () =>
          forceShutdownVms({ detached: true })
        ),
      disabled: !canForceShutdownVms.value,
      busy: isForceShuttingDownVms.value,
      hint: forceShutdownVmsErrorMessage.value,
    },
  ])

  return {
    powerStateActions,
  }
}
