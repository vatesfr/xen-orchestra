<template>
  <UiButtonGroup
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
    color="action"
  >
    <UiButton :icon-left="faPowerOff">Change power state</UiButton>
    <UiButton :icon-left="faRoute">Migrate</UiButton>
    <UiButton :icon-left="faCopy">Copy</UiButton>
    <UiButton :icon-left="faEdit">Edit config</UiButton>
    <UiButton :icon-left="faCamera">Snapshot</UiButton>
    <UiButton :icon-left="faBox">Backup</UiButton>
    <UiButton :icon-left="faTrashCan">Delete</UiButton>
    <UiButton :icon-left="faFileExport">Export</UiButton>
  </UiButtonGroup>
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

<style scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}
</style>
