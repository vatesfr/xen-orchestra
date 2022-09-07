<template>
  <UiButtonGroup
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
    color="secondary"
  >
    <UiButton :icon="faPowerOff">{{ $t("change-power-state") }}</UiButton>
    <UiButton :icon="faRoute">{{ $t("migrate") }}</UiButton>
    <UiButton :icon="faCopy">{{ $t("copy") }}</UiButton>
    <UiButton :icon="faEdit">{{ $t("edit-config") }}</UiButton>
    <UiButton :icon="faCamera">{{ $t("snapshot") }}</UiButton>
    <UiButton :icon="faBox">{{ $t("backup") }}</UiButton>
    <UiButton :icon="faTrashCan">{{ $t("delete") }}</UiButton>
    <UiButton :icon="faFileExport">{{ $t("export") }}</UiButton>
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

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}
</style>
