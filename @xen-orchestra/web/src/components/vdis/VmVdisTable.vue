<template>
  <div class="vm-vdis-table">
    <UiTitle>
      {{ t('vdis', 2) }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable :is-ready :has-error :no-data-message="vdis.length === 0 ? t('no-vdis-detected') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of vdisRecords"
            :key="row.id"
            :class="{ selected: selectedVdiId === row.id }"
            @click="selectedVdiId = row.id"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <div v-if="column.id === 'name'" v-tooltip class="name text-ellipsis">
                <VtsIcon size="medium" name="fa:hard-drive" />
                {{ column.value }}
              </div>
              <div v-else-if="column.id === 'used-space'">
                <VtsSizeProgressCell :current="column.value.used" :total="column.value.total" />
              </div>
              <div v-else-if="column.id === 'size'">
                <div class="size">
                  {{ column.value }}
                </div>
              </div>
              <div v-else v-tooltip class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredVdis.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSizeProgressCell from '@core/components/size-progress-cell/VtsSizeProgressCell.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoVdi } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdis } = defineProps<{
  vdis: XoVdi[]
  hasError: boolean
  isReady: boolean
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

const getImageFormat = (imageFormat: string | undefined) => {
  return imageFormat ? imageFormat.toUpperCase() : t('vhd')
}

const { visibleColumns, rows } = useTable('vdis', filteredVdis, {
  rowId: record => record.id,
  columns: define => [
    define('name', record => record.name_label, { label: t('vdis') }),
    define('description', record => record.name_description, { label: t('description') }),
    define('used-space', record => ({ used: record.usage, total: record.size }), { label: t('used-space') }),
    define('size', record => formatSize(record.size, 2), { label: t('size') }),
    define('format', record => getImageFormat(record.image_format), { label: t('format') }),
  ],
})

const { pageRecords: vdisRecords, paginationBindings } = usePagination('vdis', rows)

type VdiHeader = 'name' | 'description' | 'used-space' | 'size' | 'format'

const headerIcon: Record<VdiHeader, IconName> = {
  name: 'fa:a',
  description: 'fa:align-left',
  'used-space': 'fa:hashtag',
  size: 'fa:hashtag',
  format: 'fa:square-caret-down',
}
</script>

<style scoped lang="postcss">
.vm-vdis-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}
.vm-vdis-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .size {
    text-align: right;
  }
}
</style>
