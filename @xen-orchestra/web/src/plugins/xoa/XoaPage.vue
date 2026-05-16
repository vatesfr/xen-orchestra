<template>
  <div class="xoa-page">
    <VtsTable :state="tableState">
      <thead>
        <VtsRow>
          <VtsHeaderCell>Name</VtsHeaderCell>
          <VtsHeaderCell>Power state</VtsHeaderCell>
        </VtsRow>
      </thead>
      <tbody>
        <VtsRow v-for="vm in vms" :key="vm.id">
          <VtsTextCell>{{ vm.name_label }}</VtsTextCell>
          <VtsTextCell>{{ vm.power_state }}</VtsTextCell>
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script setup lang="ts">
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable, { type TableState } from '@core/components/table/VtsTable.vue'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed } from 'vue'

const { vms, areVmsReady } = useXoVmCollection()

const tableState = computed<TableState | undefined>(() =>
  areVmsReady.value ? undefined : { type: 'busy' }
)
</script>

<style scoped lang="postcss">
.xoa-page {
  padding: 2rem;
}
</style>
