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
import {
  useVmEnhancedData,
  type VmDisplayData,
  type VmFilterableData,
} from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema'
import { VM_POWER_STATE } from '@vates/types'
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

const { filterableVms, getDisplayData } = useVmEnhancedData(rawVms)

const { items: filteredVms, filter } = useQueryBuilderFilter('vms', () => filterableVms.value)

const schema = useQueryBuilderSchema<VmFilterableData>({
  '': useStringSchema(t('any-property')),
  id: useStringSchema(t('id')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  power_state: useStringSchema(t('power-state'), {
    [VM_POWER_STATE.RUNNING]: t('status:running'),
    [VM_POWER_STATE.HALTED]: t('status:halted'),
    [VM_POWER_STATE.SUSPENDED]: t('status:suspended'),
    [VM_POWER_STATE.PAUSED]: t('status:paused'),
  }),
  ipAddresses: useStringSchema(t('ip-addresses')),
  'CPUs:number': useNumberSchema(t('vcpus')),
  ramSize: useNumberSchema(t('ram'), {
    [ONE_GB]: t('n-gb', { n: 1 }),
    [2 * ONE_GB]: t('n-gb', { n: 2 }),
    [4 * ONE_GB]: t('n-gb', { n: 4 }),
    [8 * ONE_GB]: t('n-gb', { n: 8 }),
    [16 * ONE_GB]: t('n-gb', { n: 16 }),
    [32 * ONE_GB]: t('n-gb', { n: 32 }),
    [64 * ONE_GB]: t('n-gb', { n: 64 }),
    [128 * ONE_GB]: t('n-gb', { n: 128 }),
    [256 * ONE_GB]: t('n-gb', { n: 256 }),
  }),
  diskSpaceSize: useNumberSchema(t('disk-space'), {
    [ONE_GB]: t('n-gb', { n: 1 }),
    [2 * ONE_GB]: t('n-gb', { n: 2 }),
    [4 * ONE_GB]: t('n-gb', { n: 4 }),
    [8 * ONE_GB]: t('n-gb', { n: 8 }),
    [16 * ONE_GB]: t('n-gb', { n: 16 }),
    [32 * ONE_GB]: t('n-gb', { n: 32 }),
    [64 * ONE_GB]: t('n-gb', { n: 64 }),
    [128 * ONE_GB]: t('n-gb', { n: 128 }),
    [256 * ONE_GB]: t('n-gb', { n: 256 }),
    [512 * ONE_GB]: t('n-gb', { n: 512 }),
  }),
  tags: useStringSchema(t('tags')),
})

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
      selectItem: r => r(() => (selectedVmId.value = vm.id)),
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
