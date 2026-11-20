import { isVmOperationPending } from '@/libs/vm.ts'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import type { VmPowerStateAction } from '@/modules/vm/utils/vm.util.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import type { IconName } from '@core/icons'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmPowerStateActionDefinition = {
  label: string
  icon: IconName
  busy: boolean
  disabled: boolean
  run: () => unknown
}

export function useVmPowerStateActions(rawVmRefs: MaybeRefOrGetter<XenApiVm['$ref'][]>) {
  const { t } = useI18n()

  const { getByOpaqueRef: getVm } = useVmStore().subscribe()

  const xenApi = useXenApiStore().getXapi()

  const vmRefs = computed(() => toValue(rawVmRefs))

  const vms = computed(() => vmRefs.value.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))

  const vmRefsWithPowerState = computed(() =>
    vms.value.reduce((acc, vm) => ({ ...acc, [vm.$ref]: vm.power_state }), {})
  )

  const areVmsInState = (powerState: VM_POWER_STATE) => vms.value.every(vm => vm.power_state === powerState)

  const areOperationsPending = (operation: VM_OPERATION | VM_OPERATION[]) =>
    vms.value.some(vm => isVmOperationPending(vm, operation))

  const areVmsRunning = computed(() => areVmsInState(VM_POWER_STATE.RUNNING))
  const areVmsHalted = computed(() => areVmsInState(VM_POWER_STATE.HALTED))
  const areVmsSuspended = computed(() => areVmsInState(VM_POWER_STATE.SUSPENDED))
  const areVmsPaused = computed(() => areVmsInState(VM_POWER_STATE.PAUSED))

  const isStartingOnHost = computed(() => areOperationsPending(VM_OPERATION.START_ON))

  const actions = computed(
    (): Record<VmPowerStateAction, VmPowerStateActionDefinition> => ({
      start: {
        label: t('action:start'),
        icon: 'fa:play',
        busy: areOperationsPending(VM_OPERATION.START),
        disabled: !areVmsHalted.value,
        run: () => xenApi.vm.start(vmRefs.value),
      },
      pause: {
        label: t('pause'),
        icon: 'fa:pause',
        busy: areOperationsPending(VM_OPERATION.PAUSE),
        disabled: !areVmsRunning.value,
        run: () => xenApi.vm.pause(vmRefs.value),
      },
      suspend: {
        label: t('action:suspend'),
        icon: 'fa:moon',
        busy: areOperationsPending(VM_OPERATION.SUSPEND),
        disabled: !areVmsRunning.value,
        run: () => xenApi.vm.suspend(vmRefs.value),
      },
      resume: {
        label: t('action:resume'),
        icon: 'fa:play',
        busy: areOperationsPending([VM_OPERATION.UNPAUSE, VM_OPERATION.RESUME]),
        disabled: !areVmsSuspended.value && !areVmsPaused.value,
        run: () => xenApi.vm.resume(vmRefsWithPowerState.value),
      },
      reboot: {
        label: t('action:reboot'),
        icon: 'action:reboot',
        busy: areOperationsPending(VM_OPERATION.CLEAN_REBOOT),
        disabled: !areVmsRunning.value,
        run: () => xenApi.vm.reboot(vmRefs.value),
      },
      'force-reboot': {
        label: t('action:force-reboot'),
        icon: 'action:force-reboot',
        busy: areOperationsPending(VM_OPERATION.HARD_REBOOT),
        disabled: !areVmsRunning.value && !areVmsPaused.value,
        run: () => xenApi.vm.reboot(vmRefs.value, true),
      },
      shutdown: {
        label: t('action:shutdown'),
        icon: 'action:shutdown',
        busy: areOperationsPending(VM_OPERATION.CLEAN_SHUTDOWN),
        disabled: !areVmsRunning.value,
        run: () => xenApi.vm.shutdown(vmRefs.value),
      },
      'force-shutdown': {
        label: t('action:force-shutdown'),
        icon: 'action:force-shutdown',
        busy: areOperationsPending(VM_OPERATION.HARD_SHUTDOWN),
        disabled: !areVmsRunning.value && !areVmsSuspended.value && !areVmsPaused.value,
        run: () => xenApi.vm.shutdown(vmRefs.value, true),
      },
    })
  )

  return { actions, areVmsHalted, isStartingOnHost }
}
