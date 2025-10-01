<template>
  <UiTitle>
    {{ storageRepositoryTargets ? t('storage-repository') : t('backup-repository') }}
  </UiTitle>
  <div class="table-actions">
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
  </div>
  <VtsDataTable is-ready :no-data-message="unifySpaces.length === 0 ? t('no-backup-available') : undefined">
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
      <tr v-for="row of spacesRecords" :key="row.id" class="typo-body-regular-small">
        <td v-for="column of row.visibleColumns" :key="column.id">
          <template v-if="column.id == 'used-space'">
            {{ column.value }}
          </template>
          <template v-else> {{ column.value.value }} {{ column.value.prefix }} </template>
        </td>
      </tr>
    </template>
  </VtsDataTable>
  <div class="table-actions">
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
  </div>
</template>

<script setup lang="ts">
import type { XoBackupRepository } from '@/types/xo/br.type'
import type { XoSr } from '@/types/xo/sr.type'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTable } from '@core/composables/table.composable'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositoryTargets, backupRepositoryTargets } = defineProps<{
  storageRepositoryTargets?: XoSr[]
  backupRepositoryTargets?: XoBackupRepository[]
}>()

const { t } = useI18n()

const searchQuery = ref('')

const unifySpaces = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  const spaces =
    storageRepositoryTargets?.map(repository => {
      if (searchTerm) {
        if (!Object.values(repository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))) {
          return null
        }
      }

      return {
        id: repository.id,
        label: repository.name_label,
        used: repository.physical_usage,
        totalCapacity: repository.size,
        remaningSpace: repository.size - repository.physical_usage,
      }
    }) ?? []

  const backupSpaces =
    backupRepositoryTargets?.map(repository => {
      if (searchTerm) {
        if (!Object.values(repository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))) {
          return null
        }
      }

      return {
        id: repository.id,
        label: repository.name,
        used: repository.physical_usage,
        totalCapacity: repository.size,
        remaningSpace: repository.size - repository.physical_usage,
      }
    }) ?? []

  // join arrays and remove all null values if search is active
  return [...spaces, ...backupSpaces].filter(space => space !== null)
})

const { visibleColumns, rows } = useTable('backup-jobs', unifySpaces, {
  rowId: record => record.id,
  columns: define => [
    define('used-space', record => record.id, { label: t('used-space') }),
    define('remaning-space', record => formatSizeRaw(record.remaningSpace, 2), { label: t('remaning-space') }),
    define('total-capacity', record => formatSizeRaw(record.totalCapacity, 2), { label: t('total-capacity') }),
  ],
})

const { pageRecords: spacesRecords, paginationBindings } = usePagination('backups-jobs', rows)

type BackupJobHeader = 'used-space' | 'remaning-space' | 'total-capacity'

const headerIcon: Record<BackupJobHeader, IconName> = {
  'used-space': 'fa:a',
  'remaning-space': 'fa:hashtag',
  'total-capacity': 'fa:hashtag',
}
</script>
