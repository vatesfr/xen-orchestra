<template>
  <UiCard class="pool-vms-view">
    <UiCardTitle subtitle>
      VMs
      <template v-if="isMobile" #right>
        <VmsActionsBar :selected-refs="selectedVmsRefs" />
      </template>
    </UiCardTitle>
    <VmsActionsBar v-if="isDesktop" :selected-refs="selectedVmsRefs" />
    <CollectionTable
      v-model="selectedVmsRefs"
      :available-filters="filters"
      :available-sorts="filters"
      :collection="vms"
      id-property="$ref"
    >
      <template #header>
        <ColumnHeader :icon="faPowerOff" />
        <ColumnHeader>Name</ColumnHeader>
        <ColumnHeader>Description</ColumnHeader>
      </template>
      <template #row="{ item: vm }">
        <td>
          <PowerStateIcon :state="vm.power_state" />
        </td>
        <td>{{ vm.name_label }}</td>
        <td>{{ vm.name_description }}</td>
      </template>
    </CollectionTable>
  </UiCard>
</template>

<script lang="ts" setup>
import CollectionTable from "@/components/CollectionTable.vue";
import ColumnHeader from "@/components/ColumnHeader.vue";
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import VmsActionsBar from "@/components/vm/VmsActionsBar.vue";
import { useUiStore } from "@/stores/ui.store";
import { useVmStore } from "@/stores/vm.store";
import type { Filters } from "@/types/filter";
import { faPowerOff } from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const { records: vms } = useVmStore().subscribe();
const { isMobile, isDesktop } = storeToRefs(useUiStore());

const filters: Filters = {
  name_label: { label: "VM Name", type: "string" },
  name_description: { label: "VM Description", type: "string" },
  power_state: {
    label: "VM State",
    icon: faPowerOff,
    type: "enum",
    choices: ["Running", "Halted", "Paused"],
  },
};

const selectedVmsRefs = ref([]);
</script>

<style lang="postcss" scoped>
.pool-vms-view {
  overflow: auto;
}
</style>
