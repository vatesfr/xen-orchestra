<template>
  <UiCard class="pool-vms-view">
    <UiCardTitle>
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
        <ColumnHeader>{{ $t("name") }}</ColumnHeader>
        <ColumnHeader>{{ $t("description") }}</ColumnHeader>
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
import { useI18n } from "vue-i18n";

const { allRecords: vms } = storeToRefs(useVmStore());
const { isMobile, isDesktop } = storeToRefs(useUiStore());
const { t } = useI18n();

const filters: Filters = {
  name_label: { label: t("name"), type: "string" },
  name_description: { label: t("description"), type: "string" },
  power_state: {
    label: t("power-state"),
    icon: faPowerOff,
    type: "enum",
    choices: ["Running", "Halted", "Paused", "Suspended"],
  },
};

const selectedVmsRefs = ref([]);
</script>

<style lang="postcss" scoped>
.pool-vms-view {
  overflow: auto;
}
</style>
