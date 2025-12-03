<template>
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
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vm in paginatedVms" :key="vm.$ref">
          <BodyCells :item="vm" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import useCollectionFilter from '@/composables/collection-filter.composable'
import useCollectionSorter from '@/composables/collection-sorter.composable'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import type { Filters } from '@/types/filter'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { objectIcon } from '@core/icons'
import { useVmColumns } from '@core/tables/column-sets/vm-columns'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell'
import { formatSizeRaw } from '@core/utils/size.util'
import { VM_POWER_STATE } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { useArrayFilter } from '@vueuse/shared'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CollectionFilter from '../CollectionFilter.vue'
import CollectionSorter from '../CollectionSorter.vue'

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

const filteredAndSortedVms = useSorted(filteredVms, (a, b) => compareFn.value(a, b))

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', filteredAndSortedVms)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    vms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['selectItem'],
  body: (vm: XenApiVm) => {
    const guestMetrics = computed(() => getGuestMetrics(vm.guest_metrics))

    const vmMetrics = computed(() => getVmMetrics(vm.metrics))

    const ips = computed(() => [...new Set(Object.values(guestMetrics.value?.networks ?? {}).sort())])

    const ram = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))

    const vcpus = computed(() => vmMetrics.value?.VCPUs_number ?? vm.VCPUs_at_startup)

    const vbds = computed(() => getVbds(vm.VBDs).filter(vbd => vbd.type === 'Disk'))

    const vdis = computed(() => getVdis(vbds.value.map(vbd => vbd.VDI)))

    const diskSpace = computed(() =>
      formatSizeRaw(
        vdis.value.reduce((total, vdi) => total + (vdi.virtual_size ?? 0), 0),
        1
      )
    )

    return {
      vm: r => r({ label: vm.name_label, icon: objectIcon('vm', toLower(vm.power_state)) }),
      ipAddresses: r => (areGuestMetricsReady.value ? r(ips.value) : renderLoadingCell()),
      vcpus: r => (vcpus.value ? r(vcpus.value) : renderBodyCell()),
      ram: r => (ram.value.value ? r(ram.value.value, ram.value.prefix) : renderBodyCell()),
      diskSpace: r => r(diskSpace.value.value, diskSpace.value.prefix),
      tags: r => r(vm.tags),
    }
  },
})
</script>

<style lang="postcss" scoped>
.filter-and-sort {
  display: flex;
}
</style>
