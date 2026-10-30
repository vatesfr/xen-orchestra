<template>
  <div class="vdis-table">
    <UiTitle>
      {{ t('vdis') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
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
import {
  type VdiFilterableData,
  useVdiQueryBuilder,
} from '@/modules/vdi/composables/use-vdi-query-builder.composable.ts'
import { getVdiIcon } from '@/modules/vdi/utils/vdi.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { vdis, vbds, busy, error } = defineProps<{
  vdis: XenApiVdi[]
  vbds: XenApiVbd[]
  busy?: boolean
  error?: boolean
}>()
const { t } = useI18n()
const selectedVdiId = useRouteQuery('id')
const { items: filteredVdis, filter, schema } = useVdiQueryBuilder('vdi', () => vdis)
const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    vdis.length === 0 ? t('no-vdi-detected') : filteredVdis.value.length === 0 ? { type: 'no-result' } : false,
})
const { pageRecords: paginatedVdis, paginationBindings } = usePagination('vdis', filteredVdis)
const { HeadCells, BodyCells } = useVdiColumns({
  exclude: ['actions'],
  body: (vdi: VdiFilterableData) => {
    const vdiVbds = computed(() => vbds.filter(vbd => vbd.VDI === vdi.$ref))
    const size = computed(() => formatSizeRaw(vdi.virtual_size, 2))
    return {
      vdi: r =>
        r({
          label: vdi.name_label,
          icon: getVdiIcon(vdiVbds.value),
        }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.physical_utilisation, vdi.virtual_size),
      size: r => r(size.value.value, size.value.prefix),
      format: r => r(vdi.format),
      selectItem: r => r(() => (selectedVdiId.value = vdi.uuid)),
    }
  },
})
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
