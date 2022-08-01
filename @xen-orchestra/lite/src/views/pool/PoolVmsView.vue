<template>
  <UiCard class="pool-vms-view">
    <VmsActionsBar :selected-refs="selectedVmsRefs" />
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
import { storeToRefs } from "pinia";
import { ref } from "vue";
import type { Filters } from "@/types/filter";
import { faPowerOff } from "@fortawesome/pro-solid-svg-icons";
import CollectionTable from "@/components/CollectionTable.vue";
import ColumnHeader from "@/components/ColumnHeader.vue";
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import UiCard from "@/components/ui/UiCard.vue";
import VmsActionsBar from "@/components/vm/VmsActionsBar.vue";
import { useVmStore } from "@/stores/vm.store";

const vmStore = useVmStore();
const { allRecords: vms } = storeToRefs(vmStore);

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

<style lang="postcss" scoped></style>
