<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
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
import type { VmDisplayData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
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

const { HeadCells, BodyCells } = useVmColumns({
  body: (vm: VmDisplayData) => {
    return {
      vm: r => r({ label: vm.name_label, to: `/vm/${vm.id}/dashboard`, icon: vm.vmIcon }),
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
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
