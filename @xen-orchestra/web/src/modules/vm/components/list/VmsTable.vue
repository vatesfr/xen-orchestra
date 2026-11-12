<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms') }}
    </UiTitle>
    <div class="filters">
      <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
      <VmsBulkActions :vms="selectedVms" />
    </div>
    <div class="container">
      <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vm of paginatedVms" :key="vm.id" :selected="selectedVmId === vm.id">
            <BodyCells :item="vm" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import VmActions from '@/modules/vm/components/actions/VmActions.vue'
import VmsBulkActions from '@/modules/vm/components/list/VmsBulkActions.vue'
import type { VmDisplayData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  vms: rawVms,
  busy,
  error,
} = defineProps<{
  vms: FrontXoVm[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedVmId = useRouteQuery('id')

const { items: filteredVms, filter, schema, getDisplayData } = useVmQueryBuilder('vms', () => rawVms)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawVms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const displayVms = computed(() => filteredVms.value.map(vm => getDisplayData(vm)))

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', displayVms)

const {
  selectedItems: selectedVms,
  pageSelectionModel,
  isSelected,
  toggleSelection,
  selectionBindings,
} = useTableSelection({
  items: () => rawVms,
  filteredItems: filteredVms,
  pageItems: paginatedVms,
  getItemId: vm => vm.id,
})

const { HeadCells, BodyCells } = useVmColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (vm: VmDisplayData) => {
    return {
      checkbox: r =>
        r({
          selected: isSelected(vm.id),
          onToggle: () => toggleSelection(vm.id),
        }),
      vm: r =>
        r({ label: vm.name_label, to: `/vm/${vm.id}/dashboard`, icon: vm.vmIcon, iconTooltip: vm.vmIconTooltip }),
      ipAddresses: r => r(vm.ipAddresses),
      vcpus: r => r(vm.CPUs.number),
      ram: r => r(vm.formattedRam.value, vm.formattedRam.prefix),
      diskSpace: r => r(vm.formattedDiskSpace.value, vm.formattedDiskSpace.unit),
      tags: r => r(vm.tags),
      actions: r =>
        r({
          onClick: () => (selectedVmId.value = vm.id),
          component: VmActions,
          props: { vm },
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vms-table,
.filters,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.filters,
.container {
  gap: 0.8rem;
}
</style>
