<template>
  <div class="storage-repositories-targets-table">
    <UiTitle>
      {{ t('storage-repositories') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready
        :has-error
        :no-data-message="storageRepositories.length === 0 ? t('no-storage-repositories-detected') : undefined"
      >
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
          <tr v-for="row of storageRepositoriesTargetsRecords" :key="row.id" class="typo-body-regular-small">
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ number: column.id !== 'storage-repository' }"
            >
              <UiLink
                v-if="column.id === 'storage-repository'"
                size="medium"
                :to="`/#/srs/${row.id}/general`"
                icon="fa:database"
              >
                {{ column.value }}
              </UiLink>
              <template v-else-if="column.value && column.value.value < Infinity">
                {{ column.value.value }} {{ column.value.prefix }}
              </template>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && storageRepositories.length === 0" format="table" type="no-result" size="small">
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
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSizeRaw } from '@core/utils/size.util'
import type { XoSr } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositories } = defineProps<{
  storageRepositories: XoSr[]
  isReady: boolean
  hasError: boolean
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredStorageTargetsRepositories = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return storageRepositories
  }

  return storageRepositories.filter(storageRepository =>
    Object.values(storageRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('storage-repositories-targets', filteredStorageTargetsRepositories, {
  rowId: record => record.id,
  columns: define => [
    define('storage-repository', record => record.name_label, { label: t('storage-repository') }),
    define('used-space', record => formatSizeRaw(record.physical_usage, 2), { label: t('used-space') }),
    define('remaining-space', record => formatSizeRaw(record.size - record.physical_usage, 2), {
      label: t('remaining-space'),
    }),
    define('total-capacity', record => formatSizeRaw(record.size, 2), { label: t('total-capacity') }),
  ],
})

const { pageRecords: storageRepositoriesTargetsRecords, paginationBindings } = usePagination(
  'storage-repositories-targets',
  rows
)

type StorageRepositoryHeader = 'storage-repository' | 'used-space' | 'remaining-space' | 'total-capacity'

const headerIcon: Record<StorageRepositoryHeader, IconName> = {
  'storage-repository': 'fa:a',
  'used-space': 'fa:hashtag',
  'remaining-space': 'fa:hashtag',
  'total-capacity': 'fa:hashtag',
}
</script>

<style lang="postcss" scoped>
.storage-repositories-targets-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.storage-repositories-targets-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .number {
    text-align: right;
  }
}
</style>
