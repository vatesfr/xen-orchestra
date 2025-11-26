<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms', 2) }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
      <VtsTableNew :busy="!isReady" :error="hasError" :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="vm of paginatedVms" :key="vm.id" :selected="selectedVmId === vm.id">
            <BodyCells :item="vm" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import { getVmIpAddresses } from '@/utils/xo-records/vm.util'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { objectIcon } from '@core/icons'
import { useVmColumns } from '@core/tables/column-sets/vm-columns'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoVdi, XoVm } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms: rawVms } = defineProps<{
  vms: XoVm[]
  isReady: boolean
  hasError: boolean
}>()

const { getVbdsByIds } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()

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

const getDiskSpace = (vm: XoVm) => {
  const vdis = getVbdsByIds(vm.$VBDs).map(vbd => vbd?.VDI)

  const totalSize = vdis.map(vdiId => getVdiById(vdiId as XoVdi['id'])?.size || 0).reduce((sum, size) => sum + size, 0)

  const { value, prefix } = formatSizeRaw(totalSize, 1)

  return { value, unit: prefix }
}

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', filteredVms)

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['description'],
  body: (vm: XoVm) => {
    return {
      vm: r =>
        r({
          label: vm.name_label,
          to: `/vm/${vm.id}/dashboard`,
          icon: objectIcon('vm', toLower(vm.power_state)),
        }),
      ipAddresses: r => r(getVmIpAddresses(vm)),
      vcpus: r => r(vm.CPUs.number),
      ram: r => {
        const ram = formatSizeRaw(vm.memory.size, 1)
        return r(ram.value, ram.prefix)
      },
      diskSpace: r => {
        const { value, unit } = getDiskSpace(vm)
        return r(value, unit)
      },
      tags: r => r(vm.tags),
      selectId: r => r(() => (selectedVmId.value = vm.id)),
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
