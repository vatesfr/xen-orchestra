<template>
  <AppMenu
    :disabled="selectedRefs.length === 0"
    :horizontal="!isMobile"
    :shadow="isMobile"
    class="vms-actions-bar"
    placement="bottom-end"
  >
    <template v-if="isMobile" #trigger="{ isOpen, open }">
      <UiButton :active="isOpen" :icon="faEllipsis" transparent @click="open" />
    </template>
    <MenuItem :icon="faPowerOff">
      {{ $t("change-power-state") }}
      <template #submenu>
        <MenuItem
          :busy="areVmsBusyToStart"
          :disabled="!areVmsHalted"
          :icon="faPlay"
          @click="xenApi.vm.start(selectedRefs)"
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
              @click="xenApi.vm.startOn(selectedRefs, host.$ref)"
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
          @click="xenApi.vm.pause(selectedRefs)"
        >
          {{ $t("pause") }}
        </MenuItem>
        <MenuItem
          :busy="areVmsBusyToSuspend"
          :disabled="!areVmsRunning"
          :icon="faMoon"
          @click="xenApi.vm.suspend(selectedRefs)"
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
          @click="xenApi.vm.reboot(selectedRefs)"
        >
          {{ $t("reboot") }}
        </MenuItem>
        <MenuItem
          :busy="areVmsBusyToForceReboot"
          :disabled="!areVmsRunning && !areVmsPaused"
          :icon="faRepeat"
          @click="xenApi.vm.reboot(selectedRefs, true)"
        >
          {{ $t("force-reboot") }}
        </MenuItem>
        <MenuItem
          :busy="areVmsBusyToShutdown"
          :disabled="!areVmsRunning"
          :icon="faPowerOff"
          @click="xenApi.vm.shutdown(selectedRefs)"
        >
          {{ $t("shutdown") }}
        </MenuItem>
        <MenuItem
          :busy="areVmsBusyToForceShutdown"
          :disabled="!areVmsRunning && !areVmsSuspended && !areVmsPaused"
          :icon="faPlug"
          @click="xenApi.vm.shutdown(selectedRefs, true)"
        >
          {{ $t("force-shutdown") }}
        </MenuItem>
      </template>
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faRoute">
      {{ $t("migrate") }}
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faCopy">
      {{ $t("copy") }}
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faEdit">
      {{ $t("edit-config") }}
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faCamera">
      {{ $t("snapshot") }}
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faTrashCan">
      {{ $t("delete") }}
    </MenuItem>
    <MenuItem :icon="faFileExport">
      {{ $t("export") }}
      <template #submenu>
        <MenuItem
          v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
          :icon="faDisplay"
        >
          {{ $t("export-vms") }}
        </MenuItem>
        <MenuItem
          v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
          :icon="faCode"
        >
          {{ $t("export-table-to", { type: ".json" }) }}
        </MenuItem>
        <MenuItem
          v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
          :icon="faFileCsv"
        >
          {{ $t("export-table-to", { type: ".csv" }) }}
        </MenuItem>
      </template>
    </MenuItem>
  </AppMenu>
</template>

<script lang="ts" setup>
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { vTooltip } from "@/directives/tooltip.directive";
import { isHostRunning, isOperationsPending } from "@/libs/utils";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useUiStore } from "@/stores/ui.store";
import { useVmStore } from "@/stores/vm.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import {
  faCamera,
  faCirclePlay,
  faCode,
  faCopy,
  faDisplay,
  faEdit,
  faEllipsis,
  faFileCsv,
  faFileExport,
  faMoon,
  faPause,
  faPlay,
  faPlug,
  faPowerOff,
  faRepeat,
  faRotateLeft,
  faRoute,
  faServer,
  faStar,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const props = defineProps<{
  disabled?: boolean;
  selectedRefs: string[];
}>();

const { isMobile } = storeToRefs(useUiStore());
const { getByOpaqueRef: getVm } = useVmStore().subscribe();
const { records: hosts } = useHostStore().subscribe();
const { pool } = usePoolStore().subscribe();
const hostMetricsSubscription = useHostMetricsStore().subscribe();

const vms = computed<XenApiVm[]>(() =>
  props.selectedRefs
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
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}

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
