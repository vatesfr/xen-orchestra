<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms', 2) }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
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
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import { getVmIpAddresses } from '@/utils/xo-records/vm.util'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable'
import { objectIcon } from '@core/icons'
import { useVmColumns } from '@core/tables/column-sets/vm-columns'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoVdi, XoVm } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  vms: rawVms,
  busy,
  error,
} = defineProps<{
  vms: XoVm[]
  busy?: boolean
  error?: boolean
}>()

const { areVbdsReady, getVbdsByIds } = useXoVbdCollection()
const { areVdisReady, getVdiById } = useXoVdiCollection()

const { t } = useI18n()

const selectedVmId = useRouteQuery('id')

const searchQuery = ref('')

const filteredVms = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawVms
  }

  return rawVms.filter(vm => Object.values(vm).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawVms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const isDiskSpaceReady = logicAnd(areVbdsReady, areVdisReady)

const getDiskSpace = (vm: XoVm) => {
  const vdis = getVbdsByIds(vm.$VBDs).map(vbd => vbd?.VDI)

  const totalSize = vdis.map(vdiId => getVdiById(vdiId as XoVdi['id'])?.size || 0).reduce((sum, size) => sum + size, 0)

  const { value, prefix } = formatSizeRaw(totalSize, 1)

  return { value, unit: prefix }
}

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', filteredVms)

const { HeadCells, BodyCells } = useVmColumns({
  body: (vm: XoVm) => {
    const ram = computed(() => formatSizeRaw(vm.memory.size, 1))
    const diskSpace = computed(() => getDiskSpace(vm))
    const ipAddresses = computed(() => getVmIpAddresses(vm))
    const vmIcon = computed(() => objectIcon('vm', toLower(vm.power_state)))

    return {
      vm: r => r({ label: vm.name_label, to: `/vm/${vm.id}/dashboard`, icon: vmIcon.value }),
      ipAddresses: r => r(ipAddresses.value),
      vcpus: r => r(vm.CPUs.number),
      ram: r => r(ram.value.value, ram.value.prefix),
      diskSpace: r => {
        if (!isDiskSpaceReady.value) {
          return renderLoadingCell()
        }

        return r(diskSpace.value.value, diskSpace.value.unit)
      },
      tags: r => r(vm.tags),
      selectItem: r => r(() => (selectedVmId.value = vm.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.vms-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
