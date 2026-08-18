<template>
  <div class="vm-vdis-table">
    <UiTitle>
      {{ t('vdis') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
      </div>
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
import { getVdiIcon } from '@/libs/vdi.ts'
import type { XenApiVdi, XenApiVbd } from '@/libs/xen-api/xen-api.types.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns'
import { formatSize } from '@core/utils/size.util.ts'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdis, vbds } = defineProps<{
  vdis: XenApiVdi[]
  vbds: XenApiVbd[]
}>()

const { isReady, hasError } = useVdiStore().subscribe()

const { t } = useI18n()

const selectedVdiId = useRouteQuery('id')

const searchQuery = ref('')

const filteredVdis = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) return vdis

  return vdis.filter(vdi =>
    [vdi.name_label, vdi.name_description, vdi.uuid]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    vdis.length === 0 ? t('no-vdi-detected') : filteredVdis.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedVdis, paginationBindings } = usePagination('vdis', filteredVdis)

const { HeadCells, BodyCells } = useVdiColumns({
  body: (vdi: XenApiVdi) => {
    const vdiVbds = vbds.filter(vbd => vbd.VDI === vdi.$ref)

    return {
      vdi: r =>
        r({
          label: vdi.name_label,
          icon: getVdiIcon(vdiVbds),
        }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.physical_utilisation, vdi.virtual_size),
      size: r => r(formatSize(vdi.virtual_size, 2)),
      format: r => r(vdi.type === 'user' ? 'VHD' : vdi.sm_config?.['vhd-parent'] ? 'VHD' : 'RAW'),
      actions: r =>
        r({
          onClick: () => (selectedVdiId.value = vdi.uuid),
          actions: [],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vm-vdis-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container,
  .table-actions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
