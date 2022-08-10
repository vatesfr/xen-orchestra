<template>
  <AppMenu
    horizontal
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
  >
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
        <MenuItem :icon="faDisplay">Export VMs</MenuItem>
        <MenuItem :icon="faCode">Export table in .json</MenuItem>
        <MenuItem :icon="faFileCsv">Export table in .csv</MenuItem>
      </template>
    </MenuItem>
  </AppMenu>
</template>

<script lang="ts" setup>
import {
  faTrashCan,
  faBox,
  faCamera,
  faCode,
  faCopy,
  faDisplay,
  faEdit,
  faFileCsv,
  faFileExport,
  faPowerOff,
  faRoute,
} from "@fortawesome/free-solid-svg-icons";
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";

defineProps<{
  disabled?: boolean;
  selectedRefs: string[];
}>();
</script>

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}
</style>
