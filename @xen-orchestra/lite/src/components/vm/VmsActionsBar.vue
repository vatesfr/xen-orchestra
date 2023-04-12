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
          @click="xenApi.vm.start({ vmsRef: selectedRefs })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'start'))"
          :disabled="!areVmsHalted"
          :icon="faPlay"
        >
          {{ $t("start") }}
        </MenuItem>
        <MenuItem
          :busy="vms.every((vm) => isOperationsPending(vm, 'start_on'))"
          :disabled="!areVmsHalted"
          :icon="faServer"
        >
          {{ $t("start-on-host") }}
          <template #submenu>
            <MenuItem
              v-for="host in hostStore.allRecords"
              @click="
                xenApi.vm.startOn({ vmsRef: selectedRefs, hostRef: host.$ref })
              "
              v-bind:key="host.$ref"
              :icon="faServer"
            >
              <div class="wrapper">
                {{ host.name_label }}
                <div>
                  <UiIcon
                    :icon="
                      host.$ref === poolStore.pool?.master ? faStar : undefined
                    "
                    class="star"
                  />
                  <PowerStateIcon
                    :state="isHostRunning(host) ? 'Running' : 'Halted'"
                  />
                </div>
              </div>
            </MenuItem>
          </template>
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.pause({ vmsRef: selectedRefs })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'pause'))"
          :disabled="!areVmsRunning"
          :icon="faPause"
        >
          {{ $t("pause") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.suspend({ vmsRef: selectedRefs })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'suspend'))"
          :disabled="!areVmsRunning"
          :icon="faMoon"
        >
          {{ $t("suspend") }}
        </MenuItem>
        <MenuItem
          @click="
            xenApi.vm.resume({
              vmsRef: selectedRefs,
            })
          "
          :busy="
            vms.every((vm) => isOperationsPending(vm, ['unpause', 'resume']))
          "
          :disabled="!areVmsSuspended && !areVmsPaused"
          :icon="faCirclePlay"
        >
          {{ $t("resume") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.reboot({ vmsRef: selectedRefs })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'clean_reboot'))"
          :disabled="!areVmsRunning"
          :icon="faRotateLeft"
        >
          {{ $t("reboot") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.reboot({ vmsRef: selectedRefs, force: true })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'hard_reboot'))"
          :disabled="!areVmsRunning && !areVmsPaused"
          :icon="faRepeat"
        >
          {{ $t("force-reboot") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.shutdown({ vmsRef: selectedRefs })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'clean_shutdown'))"
          :disabled="!areVmsRunning"
          :icon="faPowerOff"
        >
          {{ $t("shutdown") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.shutdown({ vmsRef: selectedRefs, force: true })"
          :busy="vms.every((vm) => isOperationsPending(vm, 'hard_shutdown'))"
          :disabled="!areVmsRunning && !areVmsSuspended && !areVmsPaused"
          :icon="faPlug"
        >
          {{ $t("force-shutdown") }}
        </MenuItem>
      </template>
    </MenuItem>
    <MenuItem :icon="faRoute" v-tooltip="$t('coming-soon')">{{
      $t("migrate")
    }}</MenuItem>
    <MenuItem :icon="faCopy" v-tooltip="$t('coming-soon')">{{
      $t("copy")
    }}</MenuItem>
    <MenuItem :icon="faEdit" v-tooltip="$t('coming-soon')">{{
      $t("edit-config")
    }}</MenuItem>
    <MenuItem :icon="faCamera" v-tooltip="$t('coming-soon')">{{
      $t("snapshot")
    }}</MenuItem>
    <MenuItem :icon="faTrashCan" v-tooltip="$t('coming-soon')">{{
      $t("delete")
    }}</MenuItem>
    <MenuItem :icon="faFileExport">
      {{ $t("export") }}
      <template #submenu>
        <MenuItem
          :icon="faDisplay"
          v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
        >
          {{ $t("export-vms") }}
        </MenuItem>
        <MenuItem
          :icon="faCode"
          v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
        >
          {{ $t("export-table-to", { type: ".json" }) }}
        </MenuItem>
        <MenuItem
          :icon="faFileCsv"
          v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
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
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
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
  faTrashCan,
  faServer,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { isHostRunning, isOperationsPending } from "@/libs/utils";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useRecordsStore } from "@/stores/records.store";
import { useUiStore } from "@/stores/ui.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { computed } from "vue";
import { computedAsync } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiVm } from "@/libs/xen-api";

const props = defineProps<{
  disabled?: boolean;
  selectedRefs: string[];
}>();

const { isMobile } = storeToRefs(useUiStore());
const hostStore = useHostStore();
const poolStore = usePoolStore();
const xapiRecordsStore = useRecordsStore();

const vms = computed<XenApiVm[]>(() =>
  props.selectedRefs.map((opaqueRef) => xapiRecordsStore.getRecord(opaqueRef))
);
const xenApi = computedAsync(() => useXenApiStore().getXapi());

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
