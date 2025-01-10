<template>
  <VtsMenuItem :icon="faPlay" v-bind="startItem">
    {{ $t('start') }}
  </VtsMenuItem>
  <li>
    <VtsMenuTrigger :icon="faServer" v-bind="startOnHostItem.$trigger">
      {{ $t('start-on-host') }}
    </VtsMenuTrigger>
    <VtsMenuList border v-bind="startOnHostItem.$target">
      <VtsMenuItem v-for="host in hosts" :key="host.$ref" :icon="faServer" v-bind="startOnHostItem[host.$ref]">
        <div class="wrapper">
          {{ host.name_label }}
          <div>
            <UiIcon :icon="host.$ref === pool?.master ? faStar : undefined" class="star" />
            <PowerStateIcon :state="getHostState(host)" />
          </div>
        </div>
      </VtsMenuItem>
    </VtsMenuList>
  </li>
  <VtsMenuItem :icon="faPause" v-bind="pauseItem">
    {{ $t('pause') }}
  </VtsMenuItem>
  <VtsMenuItem :icon="faMoon" v-bind="suspendItem">
    {{ $t('suspend') }}
  </VtsMenuItem>
  <VtsMenuItem :icon="faCirclePlay" v-bind="resumeItem">
    {{ $t('resume') }}
  </VtsMenuItem>
  <VtsMenuItem :icon="faRotateLeft" v-bind="rebootItem">
    {{ $t('reboot') }}
  </VtsMenuItem>
  <VtsMenuItem :icon="faRepeat" v-bind="forceRebootItem">
    {{ $t('force-reboot') }}
  </VtsMenuItem>
  <VtsMenuItem :icon="faPowerOff" v-bind="shutdownItem">
    {{ $t('shutdown') }}
  </VtsMenuItem>
  <VtsMenuItem :icon="faPlug" v-bind="forceShutdownItem">
    {{ $t('force-shutdown') }}
  </VtsMenuItem>
</template>

<script lang="ts" setup>
import PowerStateIcon from '@/components/PowerStateIcon.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import VtsMenuTrigger from '@core/components/menu/VtsMenuTrigger.vue'
import { action, type MenuLike, useMenuAction, useMenuToggle } from '@core/packages/menu'
import {
  faCirclePlay,
  faMoon,
  faPause,
  faPlay,
  faPlug,
  faPowerOff,
  faRepeat,
  faRotateLeft,
  faServer,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  menu: MenuLike
  vmRefs: XenApiVm['$ref'][]
}>()

const { getByOpaqueRefs } = useVmStore().subscribe()
const { records: hosts } = useHostStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

const vms = computed(() => getByOpaqueRefs(props.vmRefs))

const vmRefsWithPowerState = computed(() =>
  vms.value.reduce(
    (acc, vm) => ({
      ...acc,
      [vm.$ref]: vm.power_state,
    }),
    {}
  )
)

const xenApi = useXenApiStore().getXapi()

const areVmsRunning = computed(() => vms.value.every(vm => vm.power_state === VM_POWER_STATE.RUNNING))
const areVmsHalted = computed(() => vms.value.every(vm => vm.power_state === VM_POWER_STATE.HALTED))
const areVmsSuspended = computed(() => vms.value.every(vm => vm.power_state === VM_POWER_STATE.SUSPENDED))
const areVmsPaused = computed(() => vms.value.every(vm => vm.power_state === VM_POWER_STATE.PAUSED))

const areOperationsPending = (operation: VM_OPERATION | VM_OPERATION[]) =>
  vms.value.some(vm => isVmOperationPending(vm, operation))

const areVmsBusyToStart = computed(() => areOperationsPending(VM_OPERATION.START))
const areVmsBusyToStartOnHost = computed(() => areOperationsPending(VM_OPERATION.START_ON))
const areVmsBusyToPause = computed(() => areOperationsPending(VM_OPERATION.PAUSE))
const areVmsBusyToSuspend = computed(() => areOperationsPending(VM_OPERATION.SUSPEND))
const areVmsBusyToResume = computed(() => areOperationsPending([VM_OPERATION.UNPAUSE, VM_OPERATION.RESUME]))
const areVmsBusyToReboot = computed(() => areOperationsPending(VM_OPERATION.CLEAN_REBOOT))
const areVmsBusyToForceReboot = computed(() => areOperationsPending(VM_OPERATION.HARD_REBOOT))
const areVmsBusyToShutdown = computed(() => areOperationsPending(VM_OPERATION.CLEAN_SHUTDOWN))
const areVmsBusyToForceShutdown = computed(() => areOperationsPending(VM_OPERATION.HARD_SHUTDOWN))
const getHostState = (host: XenApiHost) => (isHostRunning(host) ? VM_POWER_STATE.RUNNING : VM_POWER_STATE.HALTED)

const hasVm = computed(() => vms.value.length > 0)

const startItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToStart,
  disabled: computed(() => !hasVm.value || !areVmsHalted.value),
  handler: () => xenApi.vm.start(props.vmRefs),
})

const startOnHostItem = useMenuToggle({
  parent: props.menu,
  placement: 'right-start',
  items: Object.fromEntries(
    hosts.value.map(host => [
      host.$ref,
      action(() => xenApi.vm.startOn(props.vmRefs, host.$ref), {
        busy: areVmsBusyToStartOnHost,
        disabled: computed(() => !hasVm.value || !areVmsHalted.value),
      }),
    ])
  ),
})

const pauseItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToPause,
  disabled: computed(() => !hasVm.value || !areVmsRunning.value),
  handler: () => xenApi.vm.pause(props.vmRefs),
})

const suspendItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToSuspend,
  disabled: computed(() => !hasVm.value || !areVmsRunning.value),
  handler: () => xenApi.vm.suspend(props.vmRefs),
})

const resumeItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToResume,
  disabled: computed(() => !hasVm.value || (!areVmsSuspended.value && !areVmsPaused.value)),
  handler: () => xenApi.vm.resume(vmRefsWithPowerState.value),
})

const rebootItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToReboot,
  disabled: computed(() => !hasVm.value || !areVmsRunning.value),
  handler: () => xenApi.vm.reboot(props.vmRefs),
})

const forceRebootItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToForceReboot,
  disabled: computed(() => !hasVm.value || (!areVmsRunning.value && !areVmsPaused.value)),
  handler: () => xenApi.vm.reboot(props.vmRefs, true),
})

const shutdownItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToShutdown,
  disabled: computed(() => !hasVm.value || !areVmsRunning.value),
  handler: () => xenApi.vm.shutdown(props.vmRefs),
})

const forceShutdownItem = useMenuAction({
  parent: props.menu,
  busy: areVmsBusyToForceShutdown,
  disabled: computed(() => !hasVm.value || (!areVmsRunning.value && !areVmsSuspended.value && !areVmsPaused.value)),
  handler: () => xenApi.vm.shutdown(props.vmRefs, true),
})
</script>

<style lang="postcss" scoped>
.wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.star {
  margin: 0 1rem;
  color: var(--color-warning-item-base);
}
</style>
