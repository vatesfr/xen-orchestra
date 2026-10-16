<template>
  <div class="privilege-scope-vms-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vm of paginatedVms" :key="vm.id">
          <BodyCells :item="vm" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { usePrivilegeScopeSelection } from '@/modules/role/composables/use-privilege-scope-selection.composable.ts'
import type { VmDisplayData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const selectedIds = defineModel<string[]>('selectedIds', { required: true })

const { t } = useI18n()

const { vms, areVmsReady, hasVmFetchError } = useXoVmCollection()

const {
  items: filteredVms,
  filter,
  schema,
  getDisplayData,
} = useVmQueryBuilder('privilege-scope-vms', vms, {
  ignoreRoute: true,
})

const state = useTableState({
  busy: logicNot(areVmsReady),
  error: hasVmFetchError,
  empty: () =>
    vms.value.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const displayVms = computed(() => filteredVms.value.map(vm => getDisplayData(vm)))

const { pageRecords: paginatedVms, paginationBindings } = usePagination('privilege-scope-vms', displayVms, {
  ignoreRoute: true,
})

const { pageSelectionModel, isSelected, toggleSelection, selectionBindings } = usePrivilegeScopeSelection({
  selectedIds,
  items: vms,
  filteredItems: filteredVms,
  pageItems: paginatedVms,
  isReady: areVmsReady,
})

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (vm: VmDisplayData) => ({
    checkbox: r => r({ selected: isSelected(vm.id), onToggle: () => toggleSelection(vm.id) }),
    vm: r => r({ label: vm.name_label, to: `/vm/${vm.id}/dashboard`, icon: vm.vmIcon }),
    ipAddresses: r => r(vm.ipAddresses),
    vcpus: r => r(vm.CPUs.number),
    ram: r => r(vm.formattedRam.value, vm.formattedRam.prefix),
    diskSpace: r => r(vm.formattedDiskSpace.value, vm.formattedDiskSpace.unit),
    tags: r => r(vm.tags),
  }),
})
</script>

<style lang="postcss" scoped>
.privilege-scope-vms-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
