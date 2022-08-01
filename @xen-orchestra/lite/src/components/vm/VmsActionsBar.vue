<template>
  <UiButtonGroup
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
    color="secondary"
  >
    <UiButton :icon="faPowerOff">Change power state</UiButton>
    <UiButton :icon="faRoute">Migrate</UiButton>
    <UiButton :icon="faCopy">Copy</UiButton>
    <UiButton :icon="faEdit">Edit config</UiButton>
    <UiButton :icon="faCamera">Snapshot</UiButton>
    <UiButton :icon="faBox">Backup</UiButton>
    <UiButton :icon="faTrashCan">Delete</UiButton>
    <UiButton :icon="faFileExport">Export</UiButton>
  </UiButtonGroup>
</template>

<script lang="ts" setup>
import { faCopy, faEdit, faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import {
  faBox,
  faCamera,
  faFileExport,
  faPowerOff,
  faRoute,
} from "@fortawesome/pro-solid-svg-icons";
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
