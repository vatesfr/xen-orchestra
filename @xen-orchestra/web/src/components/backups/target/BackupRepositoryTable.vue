<template>
  <div class="backup-repository-table">
    <UiTitle>
      {{ t('backup-repository') }}
    </UiTitle>
    <div>
      <UiQuerySearchBar @search="value => (searchQuery = value)" />
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
    <VtsDataTable
      is-ready
      :no-data-message="filteredBackupRepository.length === 0 ? t('no-backup-available') : undefined"
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
        <tr v-for="row of spacesRecords" :key="row.id" class="typo-body-regular-small">
          <td v-for="column of row.visibleColumns" :key="column.id">
            <UiLink v-if="column.id == 'title'" size="medium" :icon="column.value.icon" href="/#/settings/remotes">
              {{ column.value.label }}
            </UiLink>
          </td>
        </tr>
      </template>
    </VtsDataTable>
    <div>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XoBackupRepository } from '@/types/xo/br.type'
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRepositoryTargets } = defineProps<{
  backupRepositoryTargets: XoBackupRepository[]
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredBackupRepository = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupRepositoryTargets
  }

  return backupRepositoryTargets.filter(storageRepository =>
    Object.values(storageRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('backup-jobs', filteredBackupRepository, {
  rowId: record => record.id,
  columns: define => [
    define(
      'title',
      record => ({
        label: record.name,
        id: record.id,
        icon: brIcon(record),
      }),
      { label: t('backup-repository') }
    ),
  ],
})

const { pageRecords: spacesRecords, paginationBindings } = usePagination('backups-jobs', rows)

type BackupJobHeader = /* 'used-space' | 'remaning-space' | 'total-capacity' | */ 'title'

const headerIcon: Record<BackupJobHeader, IconName> = {
  title: 'fa:object',
  // 'used-space': 'fa:hashtag',
  // 'remaning-space': 'fa:hashtag',
  // 'total-capacity': 'fa:hashtag',
}

function brIcon(br: XoBackupRepository): IconName {
  return br.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
}
</script>

<style lang="postcss" scoped>
.backup-repository-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
