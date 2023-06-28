<template>
  <MenuItem
    v-tooltip="!areAllSelectedVmsHalted && $t('selected-vms-in-execution')"
    :busy="areSomeSelectedVmsCloning"
    :disabled="!areAllSelectedVmsHalted"
    :icon="faCopy"
    @click="handleCopy"
  >
    {{ $t("copy") }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from "@/components/menu/MenuItem.vue";
import { vTooltip } from "@/directives/tooltip.directive";
import { isOperationsPending } from "@/libs/utils";
import { POWER_STATE, VM_OPERATION, type XenApiVm } from "@/libs/xen-api";
import { useVmStore } from "@/stores/vm.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

const props = defineProps<{
  selectedRefs: XenApiVm["$ref"][];
}>();

const { getByOpaqueRef } = useVmStore().subscribe();

const selectedVms = computed(() =>
  props.selectedRefs
    .map((vmRef) => getByOpaqueRef(vmRef))
    .filter((vm): vm is XenApiVm => vm !== undefined)
);

const areAllSelectedVmsHalted = computed(() =>
  selectedVms.value.every(
    (selectedVm) => selectedVm.power_state === POWER_STATE.HALTED
  )
);

const areSomeSelectedVmsCloning = computed(() =>
  selectedVms.value.some((vm) => isOperationsPending(vm, VM_OPERATION.CLONE))
);

const handleCopy = async () => {
  const xapiStore = useXenApiStore();

  const vmRefsToClone = Object.fromEntries(
    selectedVms.value.map((vm) => [vm.$ref, `${vm.name_label} (COPY)`])
  );

  await xapiStore.getXapi().vm.clone(vmRefsToClone);
};
</script>

<style lang="postcss" scoped></style>