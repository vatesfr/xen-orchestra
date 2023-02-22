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

    <MenuItem :icon="faPowerOff" v-tooltip="$t('coming-soon')">
      {{ $t("change-power-state") }}
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
import UiButton from "@/components/ui/UiButton.vue";
import { useUiStore } from "@/stores/ui.store";
import {
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
import { vTooltip } from "@/directives/tooltip.directive";

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
