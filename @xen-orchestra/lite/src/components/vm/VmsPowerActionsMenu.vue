<template>
  <MenuItem
    :busy="areVmsBusyToStart"
    :disabled="!areVmsHalted"
    :icon="faPlay"
    @click="xenApi.vm.start(vmRefs)"
  >
    {{ $t("start") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToStartOnHost"
    :disabled="!areVmsHalted"
    :icon="faServer"
  >
    {{ $t("start-on-host") }}
    <template #submenu>
      <MenuItem
        v-for="host in hosts"
        v-bind:key="host.$ref"
        :icon="faServer"
        @click="xenApi.vm.startOn(vmRefs, host.$ref)"
      >
        <div class="wrapper">
          {{ host.name_label }}
          <div>
            <UiIcon
              :icon="host.$ref === pool?.master ? faStar : undefined"
              class="star"
            />
            <PowerStateIcon :state="getHostState(host)" />
          </div>
        </div>
      </MenuItem>
    </template>
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToPause"
    :disabled="!areVmsRunning"
    :icon="faPause"
    @click="xenApi.vm.pause(vmRefs)"
  >
    {{ $t("pause") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToSuspend"
    :disabled="!areVmsRunning"
    :icon="faMoon"
    @click="xenApi.vm.suspend(vmRefs)"
  >
    {{ $t("suspend") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToResume"
    :disabled="!areVmsSuspended && !areVmsPaused"
    :icon="faCirclePlay"
    @click="xenApi.vm.resume(vmRefsWithPowerState)"
  >
    {{ $t("resume") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToReboot"
    :disabled="!areVmsRunning"
    :icon="faRotateLeft"
    @click="xenApi.vm.reboot(vmRefs)"
  >
    {{ $t("reboot") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToForceReboot"
    :disabled="!areVmsRunning && !areVmsPaused"
    :icon="faRepeat"
    @click="xenApi.vm.reboot(vmRefs, true)"
  >
    {{ $t("force-reboot") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToShutdown"
    :disabled="!areVmsRunning"
    :icon="faPowerOff"
    @click="xenApi.vm.shutdown(vmRefs)"
  >
    {{ $t("shutdown") }}
  </MenuItem>
  <MenuItem
    :busy="areVmsBusyToForceShutdown"
    :disabled="!areVmsRunning && !areVmsSuspended && !areVmsPaused"
    :icon="faPlug"
    @click="xenApi.vm.shutdown(vmRefs, true)"
  >
    {{ $t("force-shutdown") }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from "@/components/menu/MenuItem.vue";
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { isHostRunning, isOperationsPending } from "@/libs/utils";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useVmStore } from "@/stores/vm.store";
import { useXenApiStore } from "@/stores/xen-api.store";
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
} from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

const props = defineProps<{
  vmRefs: string[];
}>();

const { getByOpaqueRef: getVm } = useVmStore().subscribe();
const { records: hosts } = useHostStore().subscribe();
const { pool } = usePoolStore().subscribe();
const hostMetricsSubscription = useHostMetricsStore().subscribe();

const vms = computed<XenApiVm[]>(() =>
  props.vmRefs
    .map((opaqueRef) => getVm(opaqueRef))
    .filter((vm): vm is XenApiVm => vm !== undefined)
);

const vmRefsWithPowerState = computed(() =>
  vms.value.reduce((acc, vm) => ({ ...acc, [vm.$ref]: vm.power_state }), {})
);

const xenApi = useXenApiStore().getXapi();

const areVmsRunning = computed(() =>
  vms.value.every((vm) => vm.power_state === "Running")
);
const areVmsHalted = computed(() =>
  vms.value.every((vm) => vm.power_state === "Halted")
);
const areVmsSuspended = computed(() =>
  vms.value.every((vm) => vm.power_state === "Suspended")
);
const areVmsPaused = computed(() =>
  vms.value.every((vm) => vm.power_state === "Paused")
);

const areOperationsPending = (operation: string | string[]) =>
  vms.value.some((vm) => isOperationsPending(vm, operation));

const areVmsBusyToStart = computed(() => areOperationsPending("start"));
const areVmsBusyToStartOnHost = computed(() =>
  areOperationsPending("start_on")
);
const areVmsBusyToPause = computed(() => areOperationsPending("pause"));
const areVmsBusyToSuspend = computed(() => areOperationsPending("suspend"));
const areVmsBusyToResume = computed(() =>
  areOperationsPending(["unpause", "resume"])
);
const areVmsBusyToReboot = computed(() => areOperationsPending("clean_reboot"));
const areVmsBusyToForceReboot = computed(() =>
  areOperationsPending("hard_reboot")
);
const areVmsBusyToShutdown = computed(() =>
  areOperationsPending("clean_shutdown")
);
const areVmsBusyToForceShutdown = computed(() =>
  areOperationsPending("hard_shutdown")
);
const getHostState = (host: XenApiHost) =>
  isHostRunning(host, hostMetricsSubscription) ? "Running" : "Halted";
</script>

<style lang="postcss" scoped>
.wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.star {
  margin: 0 1rem;
  color: var(--color-orange-world-base);
}
</style>
