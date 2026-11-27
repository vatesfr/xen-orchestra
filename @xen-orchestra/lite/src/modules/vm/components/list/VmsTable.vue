<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms') }}
      <template v-if="uiStore.isSmall" #action>
        <VmsActionsBar :selected-refs="selectedVmsRefs" />
      </template>
    </UiTitle>
    <VmsActionsBar v-if="!uiStore.isSmall" :selected-refs="selectedVmsRefs" />
    <div>
      <div class="filter-and-sort">
        <CollectionFilter
          :active-filters="filters"
          :available-filters="availableFilters"
          @add-filter="addFilter"
          @remove-filter="removeFilter"
        />

        <CollectionSorter
          :active-sorts="sorts"
          :available-sorts="availableFilters"
          @add-sort="addSort"
          @remove-sort="removeSort"
          @toggle-sort-direction="toggleSortDirection"
        />
      </div>

      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <VtsHeaderCell>
              <UiCheckbox v-model="areAllVmsSelected" accent="brand" />
            </VtsHeaderCell>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vm in paginatedVms" :key="vm.$ref" :selected="selectedVmId === vm.uuid">
            <UiTableCell>
              <UiCheckbox v-model="selectedVmsRefs" :value="vm.$ref" accent="brand" />
            </UiTableCell>
            <BodyCells :item="vm" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CollectionFilter from '@/components/CollectionFilter.vue'
import CollectionSorter from '@/components/CollectionSorter.vue'
import useCollectionFilter from '@/composables/collection-filter.composable.ts'
import useCollectionSorter from '@/composables/collection-sorter.composable.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmActions from '@/modules/vm/components/actions/VmActions.vue'
import VmsActionsBar from '@/modules/vm/components/list/VmsActionsBar.vue'
import { useVmResources } from '@/modules/vm/composables/vm-resources.composable.ts'
import { getVmIcon, getVmIpAddresses } from '@/modules/vm/utils/vm.util.ts'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import type { Filters } from '@/types/filter.ts'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import useMultiSelect from '@core/composables/table/multi-select.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { VM_POWER_STATE } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { useArrayFilter } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, busy, error } = defineProps<{
  vms: XenApiVm[]
  busy?: boolean
  error?: boolean
}>()

const { getByOpaqueRef: getGuestMetrics, isReady: areGuestMetricsReady } = useVmGuestMetricsStore().subscribe()

const { t } = useI18n()
const uiStore = useUiStore()
const titleStore = usePageTitleStore()

const selectedVmId = useRouteQuery('id')

const availableFilters: Filters = {
  name_label: { label: t('name'), type: 'string' },
  name_description: { label: t('description'), type: 'string' },
  power_state: {
    label: t('power-state'),
    icon: 'fa:power-off',
    type: 'enum',
    choices: Object.values(VM_POWER_STATE),
  },
}

const { filters, addFilter, removeFilter, predicate } = useCollectionFilter<XenApiVm>({
  queryStringParam: 'filter',
})

const { sorts, addSort, removeSort, toggleSortDirection, compareFn } = useCollectionSorter<XenApiVm>({
  queryStringParam: 'sort',
})

const filteredVms = useArrayFilter(
  () => vms,
  vm => predicate.value(vm)
)

const filteredAndSortedVms = useSorted(filteredVms, (vm1, vm2) => compareFn.value(vm1, vm2))

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', filteredAndSortedVms)

const { selected: selectedVmsRefs, areAllSelected: areAllVmsSelected } = useMultiSelect(
  computed(() => vms.map(vm => vm.$ref)),
  computed(() => paginatedVms.value.map(vm => vm.$ref))
)

titleStore.setCount(() => selectedVmsRefs.value.length)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    vms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['checkbox', 'lastBackupDate'],
  body: (vm: XenApiVm) => {
    const ips = computed(() => getVmIpAddresses(getGuestMetrics(vm.guest_metrics)))
    const ram = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))
    const { vcpus, diskSize } = useVmResources(() => vm)
    const diskSpace = computed(() => formatSizeRaw(diskSize.value, 1))

    return {
      vm: r =>
        r({
          label: vm.name_label,
          to: { name: '/vm/[uuid]/dashboard', params: { uuid: vm.uuid } },
          icon: getVmIcon(vm),
        }),
      ipAddresses: r => (areGuestMetricsReady.value ? r(ips.value) : renderLoadingCell()),
      vcpus: r => (vcpus.value ? r(vcpus.value) : renderBodyCell()),
      ram: r => (ram.value.value ? r(ram.value.value, ram.value.prefix) : renderBodyCell()),
      diskSpace: r => r(diskSpace.value.value, diskSpace.value.prefix),
      tags: r => r(vm.tags),
      actions: r =>
        r({
          onClick: () => (selectedVmId.value = vm.uuid),
          component: VmActions,
          props: { vm },
        }),
    }
  },
})
</script>

<style lang="postcss" scoped>
.vms-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .filter-and-sort {
    display: flex;
  }
}
</style>
