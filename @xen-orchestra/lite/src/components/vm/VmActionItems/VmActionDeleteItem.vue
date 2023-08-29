<template>
  <MenuItem
    v-tooltip="areSomeVmsInExecution && $t('selected-vms-in-execution')"
    :disabled="areSomeVmsInExecution"
    :icon="faTrashCan"
    @click="openDeleteModal"
  >
    {{ $t("delete") }}
  </MenuItem>
  <UiModal
    v-if="isDeleteModalOpen"
    :icon="faSatellite"
    @close="closeDeleteModal"
  >
    <template #title>
      <i18n-t keypath="confirm-delete" scope="global" tag="div">
        <span class="accent">
          {{ $t("n-vms", { n: vmRefs.length }) }}
        </span>
      </i18n-t>
    </template>
    <template #subtitle>
      {{ $t("please-confirm") }}
    </template>
    <template #buttons>
      <UiButton outlined @click="closeDeleteModal">
        {{ $t("go-back") }}
      </UiButton>
      <UiButton @click="deleteVms">
        {{ $t("delete-vms", { n: vmRefs.length }) }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import MenuItem from "@/components/menu/MenuItem.vue";
import { useVmCollection } from "@/stores/xen-api/vm.store";
import { POWER_STATE } from "@/libs/xen-api/xen-api.utils";
import UiButton from "@/components/ui/UiButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";
import { useXenApiStore } from "@/stores/xen-api.store";
import { faSatellite, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiVm } from "@/libs/xen-api/xen-api.types";

const props = defineProps<{
  vmRefs: XenApiVm["$ref"][];
}>();

const xenApi = useXenApiStore().getXapi();
const { getByOpaqueRef: getVm } = useVmCollection();
const {
  open: openDeleteModal,
  close: closeDeleteModal,
  isOpen: isDeleteModalOpen,
} = useModal();

const vms = computed<XenApiVm[]>(() =>
  props.vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined)
);

const areSomeVmsInExecution = computed(() =>
  vms.value.some((vm) => vm.power_state !== POWER_STATE.HALTED)
);

const deleteVms = async () => {
  await xenApi.vm.delete(props.vmRefs);
  closeDeleteModal();
};
</script>
