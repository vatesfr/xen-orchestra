<template>
  <UiCard class="vms-page-content">
    <UiCardTitle subtitle>
      {{ t('vms') }}
      <template v-if="uiStore.isSmall" #right>
        <VmsActionsBar :selected-refs="selectedVmsRefs" />
      </template>
    </UiCardTitle>
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
import useCollectionFilter from '@/composables/collection-filter.composable'
import useCollectionSorter from '@/composables/collection-sorter.composable'
import useMultiSelect from '@/composables/multi-select.composable'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import type { Filters } from '@/types/filter'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { objectIcon } from '@core/icons'
import { useUiStore } from '@core/stores/ui.store'
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
      vm: r =>
        r({ label: vm.name_label, to: `/vm/${vm.uuid}/dashboard`, icon: objectIcon('vm', toLower(vm.power_state)) }),
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
.vms-page-content {
  overflow: auto;
  margin: 1rem;
  gap: 0;

  .filter-and-sort {
    display: flex;
  }
}
</style>
