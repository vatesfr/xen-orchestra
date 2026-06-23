import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import { useXoVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
import { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import { useXoVmSnapshotJob } from '@/modules/vm/jobs/xo-vm-snapshot.job.ts'
import { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

export type VmActionName =
  | 'start'
  | 'resume'
  | 'unpause'
  | 'pause'
  | 'suspend'
  | 'reboot'
  | 'forceReboot'
  | 'shutdown'
  | 'forceShutdown'
  | 'snapshot'
  | 'delete'

export type VmRowAction = ActionItem & { name?: VmActionName; class?: string; separator?: boolean }

export function useVmRowActions(vmInput: MaybeRefOrGetter<FrontXoVm>) {
  const vmRef = computed(() => toValue(vmInput))
  const { t } = useI18n()
  const { hasGuestTools, xo5VmAdvancedHref } = useXoVmUtils(() => vmRef.value)

  // Start
  const { run: start, canRun: canStart, isRunning: isStarting } = useXoVmStartJob(() => [vmRef.value])
  const canDisplayStart = computed(() => canStart.value || isStarting.value)

  // Pause
  const { run: pause, canRun: canPause, isRunning: isPausing } = useXoVmPauseJob(() => [vmRef.value])

  const openPauseBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'pause', href: xo5VmAdvancedHref },
  })

  const canDisplayPause = computed(() => canPause.value || vmRef.value.power_state === VM_POWER_STATE.RUNNING)

  // Unpause
  const { run: unpause, canRun: canUnpause, isRunning: isUnpausing } = useXoVmUnpauseJob(() => [vmRef.value])
  const isPaused = computed(() => vmRef.value.power_state === VM_POWER_STATE.PAUSED)
  const canDisplayUnpause = computed(() => (isPaused.value && canUnpause.value) || isUnpausing.value)

  // Suspend
  const { run: suspend, canRun: canSuspendJob, isRunning: isSuspending } = useXoVmSuspendJob(() => [vmRef.value])
  const canSuspend = computed(() => hasGuestTools(vmRef.value))

  const openSuspendBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'suspend', href: xo5VmAdvancedHref },
  })

  const canDisplaySuspend = computed(() => canSuspendJob.value || vmRef.value.power_state === VM_POWER_STATE.RUNNING)

  // Resume
  const { run: resume, canRun: canResume, isRunning: isResuming } = useXoVmResumeJob(() => [vmRef.value])
  const isSuspended = computed(() => vmRef.value.power_state === VM_POWER_STATE.SUSPENDED)
  const canDisplayResume = computed(() => (isSuspended.value && canResume.value) || isResuming.value)

  // Reboot
  const { run: reboot, canRun: canReboot, isRunning: isRebooting } = useXoVmRebootJob(() => [vmRef.value])
  const canRebootWithTools = computed(() => hasGuestTools(vmRef.value))

  const canDisplayReboot = logicOr(
    () => canReboot.value,
    () => vmRef.value.power_state === VM_POWER_STATE.RUNNING,
    () => vmRef.value.power_state === VM_POWER_STATE.PAUSED
  )

  const openRebootModal = useModal({
    component: import('@core/components/modal/VtsActionModal.vue'),
    props: { accent: 'info', action: 'reboot', object: 'vm' },
    onConfirm: () => reboot(),
  })

  const openRebootBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'clean_reboot', href: xo5VmAdvancedHref },
  })

  // Force reboot
  const {
    run: forceReboot,
    canRun: canForceReboot,
    isRunning: isForceRebooting,
  } = useXoVmForceRebootJob(() => [vmRef.value])

  const canDisplayForceReboot = logicOr(
    () => canForceReboot.value,
    () => vmRef.value.power_state === VM_POWER_STATE.RUNNING,
    () => vmRef.value.power_state === VM_POWER_STATE.PAUSED
  )

  const openForceRebootModal = useModal({
    component: import('@core/components/modal/VtsActionModal.vue'),
    props: { accent: 'info', action: 'force-reboot', object: 'vm' },
    onConfirm: () => forceReboot(),
  })

  const openForceRebootBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'hard_reboot', href: xo5VmAdvancedHref },
  })

  // Shutdown
  const { run: shutdown, canRun: canShutdown, isRunning: isShuttingDown } = useXoVmShutdownJob(() => [vmRef.value])
  const canShutdownWithTools = computed(() => hasGuestTools(vmRef.value))

  const canDisplayShutdown = computed(() => canShutdown.value || vmRef.value.power_state === VM_POWER_STATE.RUNNING)

  const openShutdownModal = useModal({
    component: import('@core/components/modal/VtsActionModal.vue'),
    props: { accent: 'info', action: 'shutdown', object: 'vm' },
    onConfirm: () => shutdown(),
  })

  const openShutdownBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'clean_shutdown', href: xo5VmAdvancedHref },
  })

  // Force shutdown
  const {
    run: forceShutdown,
    canRun: canForceShutdown,
    isRunning: isForceShuttingDown,
  } = useXoVmForceShutdownJob(() => [vmRef.value])

  const canDisplayForceShutdown = logicOr(
    () => canForceShutdown.value,
    () => vmRef.value.power_state === VM_POWER_STATE.RUNNING,
    () => vmRef.value.power_state === VM_POWER_STATE.SUSPENDED,
    () => vmRef.value.power_state === VM_POWER_STATE.PAUSED
  )

  const openForceShutdownModal = useModal({
    component: import('@core/components/modal/VtsActionModal.vue'),
    props: { accent: 'info', action: 'force-shutdown', object: 'vm' },
    onConfirm: () => forceShutdown(),
  })

  const openForceShutdownBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'hard_shutdown', href: xo5VmAdvancedHref },
  })

  // Snapshot
  const { run: snapshot, isRunning: isSnapshotting } = useXoVmSnapshotJob(() => [vmRef.value])

  // Delete
  const { run: deleteVM, canRun: canDelete, isRunning: isDeleting } = useXoVmDeleteJob(() => [vmRef.value])
  const router = useRouter()

  const openDeleteModal = useModal({
    component: import('@/modules/vm/components/modal/VmDeleteModal.vue'),
    props: { count: 1 },
    onConfirm: async () => {
      let result
      try {
        result = await deleteVM()
      } catch (error) {
        console.error('Error when deleting VM:', error)
      }
      if (result?.[0]?.status === 'fulfilled' && router.currentRoute.value.path.includes(`/vm/${vmRef.value.id}`)) {
        await router.push({ name: '/pool/[id]/dashboard', params: { id: vmRef.value.$pool } })
      }
    },
  })

  const openDeleteBlockedModal = useModal({
    component: import('@core/components/modal/VtsBlockedModal.vue'),
    props: { blockedOperation: 'destroy', href: xo5VmAdvancedHref },
  })

  // List of actions
  const actions = computed<VmRowAction[]>(() => {
    const result: VmRowAction[] = []

    if (canDisplayStart.value) {
      result.push({
        name: 'start',
        label: t('action:start'),
        icon: 'fa:play',
        busy: isStarting.value,
        onClick: start,
      })
    }

    if (canDisplayResume.value) {
      result.push({
        name: 'resume',
        label: t('action:resume'),
        icon: 'fa:play',
        busy: isResuming.value,
        onClick: resume,
      })
    }

    if (canDisplayPause.value) {
      result.push({
        name: 'pause',
        label: t('pause'),
        icon: 'fa:pause',
        busy: isPausing.value,
        onClick: () => (canPause.value ? pause() : openPauseBlockedModal()),
      })
    }

    if (canDisplayUnpause.value) {
      result.push({
        name: 'unpause',
        label: t('action:resume'),
        icon: 'fa:play',
        busy: isUnpausing.value,
        onClick: unpause,
      })
    }

    if (canDisplaySuspend.value) {
      result.push({
        name: 'suspend',
        label: t('action:suspend'),
        icon: 'fa:moon',
        disabled: !canSuspend.value,
        hint: !canSuspend.value ? t('vm-tools-missing') : undefined,
        busy: isSuspending.value,
        onClick: () => (canSuspendJob.value ? suspend() : openSuspendBlockedModal()),
      })
    }

    if (canDisplayReboot.value) {
      result.push({
        name: 'reboot',
        label: t('action:reboot'),
        icon: 'action:reboot',
        disabled: !canRebootWithTools.value,
        hint: !canRebootWithTools.value ? t('vm-tools-missing') : undefined,
        busy: isRebooting.value,
        onClick: () => (canReboot.value ? openRebootModal() : openRebootBlockedModal()),
      })
    }

    if (canDisplayForceReboot.value) {
      result.push({
        name: 'forceReboot',
        label: t('action:force-reboot'),
        icon: 'action:force-reboot',
        busy: isForceRebooting.value,
        onClick: () => (canForceReboot.value ? openForceRebootModal() : openForceRebootBlockedModal()),
      })
    }

    if (canDisplayShutdown.value) {
      result.push({
        name: 'shutdown',
        label: t('action:shutdown'),
        icon: 'action:shutdown',
        disabled: !canShutdownWithTools.value,
        hint: !canShutdownWithTools.value ? t('vm-tools-missing') : undefined,
        busy: isShuttingDown.value,
        onClick: () => (canShutdown.value ? openShutdownModal() : openShutdownBlockedModal()),
      })
    }

    if (canDisplayForceShutdown.value) {
      result.push({
        name: 'forceShutdown',
        label: t('action:force-shutdown'),
        icon: 'action:force-shutdown',
        busy: isForceShuttingDown.value,
        onClick: () => (canForceShutdown.value ? openForceShutdownModal() : openForceShutdownBlockedModal()),
      })
    }

    result.push({ separator: true })

    result.push({
      name: 'snapshot',
      label: t('snapshot'),
      icon: 'action:snapshot',
      busy: isSnapshotting.value,
      onClick: snapshot,
    })

    result.push({
      name: 'delete',
      label: t('action:delete'),
      icon: 'action:delete',
      busy: isDeleting.value,
      class: 'delete',
      onClick: () => (canDelete.value ? openDeleteModal() : openDeleteBlockedModal()),
    })

    return result
  })

  return { actions }
}
