<template>
  <MenuItem
    v-tooltip="areSomeVmsInExecution && $t('selected-vms-in-execution')"
    :disabled="isDisabled"
    :icon="faTrashCan"
    @click="openDeleteModal"
  >
    {{ $t("delete") }}
  </MenuItem>
  <UiModal v-model="isDeleteModalOpen">
    <PrimaryModalContainer :icon="faSatellite">
      <template #title>
        <i18n-t keypath="confirm-delete" scope="global" tag="div">
          <span :class="textClass">
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
    </PrimaryModalContainer>
  </UiModal>
</template>

<script lang="ts" setup>
import MenuItem from "@/components/menu/MenuItem.vue";
import PrimaryModalContainer from "@/components/ui/modals/layouts/ConfirmModalLayout.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { useColorContext } from "@/composables/color-context.composable";
import useModal from "@/composables/modal.composable";
import { useVmCollection } from "@/composables/xen-api-collection/vm-collection.composable";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiVm } from "@/libs/xen-api";
import { POWER_STATE } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import { faSatellite, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

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

const isDisabled = computed(
  () => vms.value.length === 0 || areSomeVmsInExecution.value
);

const deleteVms = async () => {
  await xenApi.vm.delete(props.vmRefs);
  closeDeleteModal();
};

const { textClass } = useColorContext();
</script>
