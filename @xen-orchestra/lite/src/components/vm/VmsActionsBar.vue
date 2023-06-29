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
      {{ $t("change-state") }}
      <template #submenu>
        <VmActionPowerStateItems :vm-refs="selectedRefs" />
      </template>
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faRoute">
      {{ $t("migrate") }}
    </MenuItem>
    <VmActionCopyItem :selected-refs="selectedRefs" />
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faEdit">
      {{ $t("edit-config") }}
    </MenuItem>
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faCamera">
      {{ $t("snapshot") }}
    </MenuItem>
    <VmActionDeleteItem :vm-refs="selectedRefs" />
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
import UiButton from "@/components/ui/UiButton.vue";
import VmActionCopyItem from "@/components/vm/VmActionItems/VmActionCopyItem.vue";
import VmActionDeleteItem from "@/components/vm/VmActionItems/VmActionDeleteItem.vue";
import VmActionPowerStateItems from "@/components/vm/VmActionItems/VmActionPowerStateItems.vue";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiVm } from "@/libs/xen-api";
import { useUiStore } from "@/stores/ui.store";
import {
  faCamera,
  faCode,
  faDisplay,
  faEdit,
  faEllipsis,
  faFileCsv,
  faFileExport,
  faPowerOff,
  faRoute,
} from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";

defineProps<{
  disabled?: boolean;
  selectedRefs: XenApiVm["$ref"][];
}>();

const { isMobile } = storeToRefs(useUiStore());
</script>

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}
</style>
