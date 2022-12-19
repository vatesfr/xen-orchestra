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

    <MenuItem :icon="faPowerOff">{{ $t("change-power-state") }}</MenuItem>
    <MenuItem :icon="faRoute">{{ $t("migrate") }}</MenuItem>
    <MenuItem :icon="faCopy">{{ $t("copy") }}</MenuItem>
    <MenuItem :icon="faEdit">{{ $t("edit-config") }}</MenuItem>
    <MenuItem :icon="faCamera">{{ $t("snapshot") }}</MenuItem>
    <MenuItem :icon="faBox">{{ $t("backup") }}</MenuItem>
    <MenuItem :icon="faTrashCan">{{ $t("delete") }}</MenuItem>
    <MenuItem :icon="faFileExport">
      {{ $t("export") }}
      <template #submenu>
        <MenuItem :icon="faDisplay">{{ $t("export-vms") }}</MenuItem>
        <MenuItem :icon="faCode">
          {{ $t("export-table-to", { type: ".json" }) }}
        </MenuItem>
        <MenuItem :icon="faFileCsv">
          {{ $t("export-table-to", { type: ".csv" }) }}
        </MenuItem>
      </template>
    </MenuItem>
  </AppMenu>
</template>

<script lang="ts" setup>
import UiButton from "@/components/ui/UiButton.vue";
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import { useUiStore } from "@/stores/ui.store";
import {
  faBox,
  faCamera,
  faCode,
  faCopy,
  faDisplay,
  faEdit,
  faEllipsis,
  faFileCsv,
  faFileExport,
  faPowerOff,
  faRoute,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";

defineProps<{
  disabled?: boolean;
  selectedRefs: string[];
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
