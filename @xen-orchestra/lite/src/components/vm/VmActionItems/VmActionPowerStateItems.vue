<template>
  <MenuItem :busy="areVmsBusyToStart" :disabled="!areVmsHalted" :icon="faPlay" @click="xenApi.vm.start(vmRefs)">
    {{ t('start') }}
  </MenuItem>
  <MenuItem :busy="areVmsBusyToStartOnHost" :disabled="!areVmsHalted" :icon="faServer">
    {{ t('start-on-host') }}
    <template #submenu>
      <MenuItem v-for="host in hosts" :key="host.$ref" :icon="faServer" @click="xenApi.vm.startOn(vmRefs, host.$ref)">
        <div class="wrapper">
          {{ host.name_label }}
          <div>
            <UiIcon :icon="host.$ref === pool?.master ? faStar : undefined" class="star" />
            <PowerStateIcon :state="getHostState(host)" />
          </div>
        </div>
      </MenuItem>
    </template>
  </MenuItem>
  <MenuItem :busy="areVmsBusyToPause" :disabled="!areVmsRunning" :icon="faPause" @click="xenApi.vm.pause(vmRefs)">
    {{ t('pause') }}
  </MenuItem>
  <MenuItem :busy="areVmsBusyToSuspend" :disabled="!areVmsRunning" :icon="faMoon" @click="xenApi.vm.suspend(vmRefs)">
    {{ t('suspend') }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToResume"
    :disabled="!areVmsSuspended && !areVmsPaused"
    :icon="faCirclePlay"
    @click="xenApi.vm.resume(vmRefsWithPowerState)"
  >
    {{ t('resume') }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToReboot"
    :disabled="!areVmsRunning"
    :icon="faRotateLeft"
    @click="xenApi.vm.reboot(vmRefs)"
  >
    {{ t('reboot') }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToForceReboot"
    :disabled="!areVmsRunning && !areVmsPaused"
    :icon="faRepeat"
    @click="xenApi.vm.reboot(vmRefs, true)"
  >
    {{ t('force-reboot') }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToShutdown"
    :disabled="!areVmsRunning"
    :icon="faPowerOff"
    @click="xenApi.vm.shutdown(vmRefs)"
  >
    {{ t('shutdown') }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToForceShutdown"
    :disabled="!areVmsRunning && !areVmsSuspended && !areVmsPaused"
    :icon="faPlug"
    @click="xenApi.vm.shutdown(vmRefs, true)"
  >
    {{ t('force-shutdown') }}
  </MenuItem>
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
import MenuItem from '@core/components/menu/MenuItem.vue'
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
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { getByOpaqueRef: getVm } = useVmStore().subscribe()
const { records: hosts } = useHostStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

const vms = computed(() => props.vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))

const vmRefsWithPowerState = computed(() => vms.value.reduce((acc, vm) => ({ ...acc, [vm.$ref]: vm.power_state }), {}))

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
