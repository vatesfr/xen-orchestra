<template>
  <UiCard class="vms-page-content">
    <UiTitle>
      {{ t('vms') }}
      <template v-if="uiStore.isSmall" #right>
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

      <VtsTable :state :pagination-bindings>
        <thead>
          <tr>
            <VtsHeaderCell>
              <UiCheckbox v-model="areAllVmsSelected" accent="brand" />
            </VtsHeaderCell>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vm in paginatedVms" :key="vm.$ref">
            <UiTableCell>
              <UiCheckbox v-model="selectedVmsRefs" :value="vm.$ref" accent="brand" />
            </UiTableCell>
            <BodyCells :item="vm" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import CollectionFilter from '@/components/CollectionFilter.vue'
import CollectionSorter from '@/components/CollectionSorter.vue'
import VmsActionsBar from '@/components/vm/VmsActionsBar.vue'
import useCollectionFilter from '@/composables/collection-filter.composable.ts'
import useCollectionSorter from '@/composables/collection-sorter.composable.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import type { Filters } from '@/types/filter.ts'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import useMultiSelect from '@core/composables/table/multi-select.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon } from '@core/icons'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { VM_POWER_STATE } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { useArrayFilter } from '@vueuse/shared'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, busy, error } = defineProps<{
  vms: XenApiVm[]
  busy?: boolean
  error?: boolean
}>()

const { getByOpaqueRef: getGuestMetrics, isReady: areGuestMetricsReady } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getVmMetrics } = useVmMetricsStore().subscribe()
const { getByOpaqueRefs: getVbds } = useVbdStore().subscribe()
const { getByOpaqueRefs: getVdis } = useVdiStore().subscribe()

const { t } = useI18n()
const uiStore = useUiStore()
const titleStore = usePageTitleStore()

titleStore.setTitle(t('vms'))

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

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    vms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const getIpAddresses = (vm: XenApiVm) => [
  ...new Set(Object.values(getGuestMetrics(vm.guest_metrics)?.networks ?? {}).sort()),
]

const getVcpus = (vm: XenApiVm) => getVmMetrics(vm.metrics)?.VCPUs_number ?? vm.VCPUs_at_startup

const getDiskSpace = (vm: XenApiVm) =>
  getVdis(
    getVbds(vm.VBDs)
      .filter(vbd => vbd.type === 'Disk')
      .map(vbd => vbd.VDI)
  ).reduce((total, vdi) => total + (vdi.virtual_size ?? 0), 0)

const { HeadCells, BodyCells, sortItems } = useVmColumns({
  exclude: ['actions', 'checkbox'],
  body: (vm: XenApiVm) => {
    const ips = computed(() => getIpAddresses(vm))
    const ram = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))
    const vcpus = computed(() => getVcpus(vm))
    const diskSpace = computed(() => formatSizeRaw(getDiskSpace(vm), 1))

    return {
      vm: r =>
        r({ label: vm.name_label, to: `/vm/${vm.uuid}/dashboard`, icon: objectIcon('vm', toLower(vm.power_state)) }),
      ipAddresses: r => (areGuestMetricsReady.value ? r(ips.value) : renderLoadingCell()),
      vcpus: r => (vcpus.value ? r(vcpus.value) : renderBodyCell()),
      ram: r => (ram.value.value ? r(ram.value.value, ram.value.prefix) : renderBodyCell()),
      diskSpace: r => r(diskSpace.value.value, diskSpace.value.prefix),
      tags: r => r(vm.tags),
    }
  },
  sort: {
    vm: sortByNameLabel,
    ipAddresses: (vm1, vm2) => compareStrings(getIpAddresses(vm1)[0] ?? '', getIpAddresses(vm2)[0] ?? ''),
    vcpus: (vm1, vm2) => getVcpus(vm1) - getVcpus(vm2),
    ram: (vm1, vm2) => vm1.memory_dynamic_max - vm2.memory_dynamic_max,
    diskSpace: (vm1, vm2) => getDiskSpace(vm1) - getDiskSpace(vm2),
  },
})

const sortedVms = computed(() => sortItems(filteredAndSortedVms.value))

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', sortedVms)

const { selected: selectedVmsRefs, areAllSelected: areAllVmsSelected } = useMultiSelect(
  computed(() => vms.map(vm => vm.$ref)),
  computed(() => paginatedVms.value.map(vm => vm.$ref))
)

titleStore.setCount(() => selectedVmsRefs.value.length)
</script>

<style lang="postcss" scoped>
.vms-page-content {
  overflow: auto;
  margin: 1rem;

  .filter-and-sort {
    display: flex;
  }
}
</style>
