<template>
  <div class="storage-repository-table">
    <UiTitle>
      {{ t('storage-repository') }}
    </UiTitle>
    <div class="table-actions">
      <UiQuerySearchBar @search="value => (searchQuery = value)" />
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
    <VtsDataTable
      is-ready
      :no-data-message="filteredStorageRepository.length === 0 ? t('no-backup-available') : undefined"
    >
      <template #thead>
        <tr>
          <template v-for="column of visibleColumns" :key="column.id">
            <th>
              <div v-tooltip class="text-ellipsis">
                <VtsIcon size="medium" :name="headerIcon[column.id]">
                  {{ column.label }}
                </VtsIcon>
              </div>
            </th>
          </template>
        </tr>
      </template>
      <template #tbody>
        <tr v-for="row of spacesRecords" :key="row.id" class="typo-body-regular-small">
          <td v-for="column of row.visibleColumns" :key="column.id">
            <UiLink v-if="column.id == 'title'" size="medium" :to="column.value.link" icon="fa:database">
              {{ column.value.label }}
            </UiLink>
            <template v-else-if="column.value && column.value.value < Infinity">
              {{ column.value.value }} {{ column.value.prefix }}
            </template>
          </td>
        </tr>
      </template>
    </VtsDataTable>
    <div class="table-actions">
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XoSr } from '@/types/xo/sr.type'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTable } from '@core/composables/table.composable'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositoryTargets } = defineProps<{
  storageRepositoryTargets: XoSr[]
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredStorageRepository = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return storageRepositoryTargets
  }

  return storageRepositoryTargets.filter(storageRepository =>
    Object.values(storageRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('backup-jobs', filteredStorageRepository, {
  rowId: record => record.id,
  columns: define => [
    define(
      'title',
      record => ({
        label: record.name_label,
        id: record.id,
        link: storageRepositoryTargets ? `/srs/${record.id}` : '',
      }),
      { label: storageRepositoryTargets ? t('storage-repository') : t('backup-repository') }
    ),
    define('used-space', record => formatSizeRaw(record.physical_usage, 2), { label: t('used-space') }),
    define('remaning-space', record => formatSizeRaw(record.size - record.physical_usage, 2), {
      label: t('remaning-space'),
    }),
    define('total-capacity', record => formatSizeRaw(record.size, 2), { label: t('total-capacity') }),
  ],
})

const { pageRecords: spacesRecords, paginationBindings } = usePagination('backups-jobs', rows)

type BackupJobHeader = 'used-space' | 'remaning-space' | 'total-capacity' | 'title'

const headerIcon: Record<BackupJobHeader, IconName> = {
  title: 'fa:object',
  'used-space': 'fa:hashtag',
  'remaning-space': 'fa:hashtag',
  'total-capacity': 'fa:hashtag',
}
</script>

<style lang="postcss" scoped>
.storage-repository-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
