<template>
  <AppMenu
    horizontal
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
  >
    <MenuItem :icon="faPowerOff">Change power state</MenuItem>
    <MenuItem :icon="faRoute">Migrate</MenuItem>
    <MenuItem :icon="faCopy">Copy</MenuItem>
    <MenuItem :icon="faEdit">Edit config</MenuItem>
    <MenuItem :icon="faCamera">Snapshot</MenuItem>
    <MenuItem :icon="faBoxTaped">Backup</MenuItem>
    <MenuItem :icon="faTrash">Delete</MenuItem>
    <MenuItem :icon="faFileExport">
      Export
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
  faBoxTaped,
  faCamera,
  faCode,
  faCopy,
  faDisplay,
  faEdit,
  faFileCsv,
  faFileExport,
  faPowerOff,
  faRoute,
  faTrash,
} from "@fortawesome/pro-light-svg-icons";
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
