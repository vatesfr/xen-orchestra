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
    <MenuItem
      :disabled="areVmsInExecution"
      :icon="faTrashCan"
      @click="openDeleteModal"
    >
      {{ $t("delete") }}
    </MenuItem>
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
  <UiModal v-if="isDeleteModalOpen" :icon="faSatellite">
    <template #title>
      {{ $t("confirm-delete") }}
      <span class="n-vms-text">
        {{ $t("n-vms", { n: selectedRefs.length }) }}
      </span>
    </template>
    <template #subtitle>
      {{ $t("please-confirm") }}
    </template>
    <template #buttons>
      <UiButton outlined @click="closeDeleteModal">
        {{ $t("go-back") }}
      </UiButton>
      <UiButton @click="deleteVms">
        {{ $t("delete-vms", { n: selectedRefs.length }) }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";
import { useVmStore } from "@/stores/vm.store";
import { useUiStore } from "@/stores/ui.store";
import VmActionPowerStateItems from "@/components/vm/VmActionItems/VmActionPowerStateItems.vue";
import VmActionCopyItem from "@/components/vm/VmActionItems/VmActionCopyItem.vue";
import VmsPowerActionsMenu from "@/components/vm/VmsPowerActionsMenu.vue";
import { useXenApiStore } from "@/stores/xen-api.store";
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
  faSatellite,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiVm } from "@/libs/xen-api";

const props = defineProps<{
  disabled?: boolean;
  selectedRefs: string[];
}>();

const { isMobile } = storeToRefs(useUiStore());
const xenApi = useXenApiStore().getXapi();
const { getByOpaqueRef: getVm } = useVmStore().subscribe();
const {
  open: openDeleteModal,
  close: closeDeleteModal,
  isOpen: isDeleteModalOpen,
} = useModal();

const vms = computed<XenApiVm[]>(() =>
  props.selectedRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined)
);

const areVmsInExecution = computed(() =>
  vms.value.every((vm) => vm.power_state !== "Halted")
);

const deleteVms = async () => {
  await xenApi.vm.delete(props.selectedRefs);
  closeDeleteModal();
};
</script>

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}
.n-vms-text {
  color: var(--color-extra-blue-base);
}
</style>
