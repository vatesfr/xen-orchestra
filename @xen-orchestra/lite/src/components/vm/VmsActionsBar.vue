<template>
  <AppMenu
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
    horizontal
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
import {
  faCopy,
  faEdit,
  faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import {
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
import UiButton from "@/components/ui/UiButton.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";

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
