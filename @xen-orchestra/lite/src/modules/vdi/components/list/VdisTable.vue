<template>
  <div class="vdis-table">
    <UiTitle>
      {{ t('vdis') }}
    </UiTitle>
    <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vdi of paginatedVdis" :key="vdi.uuid" :selected="selectedVdiId === vdi.uuid">
            <BodyCells :item="vdi" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiVbd, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { compareVdiUsages, getVdiFormat, getVdiIcon } from '@/modules/vdi/utils/vdi.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { sortByNameDescription } from '@core/utils/sort-by-name-description.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { vdis, vbds, busy, error } = defineProps<{
  vdis: XenApiVdi[]
  vbds: XenApiVbd[]
  busy?: boolean
  error?: boolean
}>()
const { t } = useI18n()
const selectedVdiId = useRouteQuery('id')
const searchQuery = ref('')
const filteredVdis = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return vdis
  }
  return vdis.filter(vdi => Object.values(vdi).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})
const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    vdis.length === 0 ? t('no-vdi-detected') : filteredVdis.value.length === 0 ? { type: 'no-result' } : false,
})
const { HeadCells, BodyCells, sortItems } = useVdiColumns({
  exclude: ['actions'],
  body: (vdi: XenApiVdi) => {
    const vdiVbds = computed(() => vbds.filter(vbd => vbd.VDI === vdi.$ref))
    const size = computed(() => formatSizeRaw(vdi.virtual_size, 2))
    const format = computed(() => getVdiFormat(vdi.sm_config['image-format']))
    return {
      vdi: r =>
        r({
          label: vdi.name_label,
          icon: getVdiIcon(vdiVbds.value),
        }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.physical_utilisation, vdi.virtual_size),
      size: r => r(size.value.value, size.value.prefix),
      format: r => r(format.value),
      selectItem: r => r(() => (selectedVdiId.value = vdi.uuid)),
    }
  },
  sort: {
    vdi: sortByNameLabel,
    description: sortByNameDescription,
    usedSpace: compareVdiUsages,
    size: (vdi1, vdi2) => vdi1.virtual_size - vdi2.virtual_size,
    format: (vdi1, vdi2) =>
      compareStrings(getVdiFormat(vdi1.sm_config['image-format']), getVdiFormat(vdi2.sm_config['image-format'])),
  },
})

const sortedVdis = computed(() => sortItems(filteredVdis.value))

const { pageRecords: paginatedVdis, paginationBindings } = usePagination('vdis', sortedVdis)
</script>

<style scoped lang="postcss">
.vdis-table,
.container {
  display: flex;
  flex-direction: column;
}
.vdis-table {
  gap: 2.4rem;
  .container {
    gap: 0.8rem;
  }
}
</style>
