<template>
  <div class="backup-repositories-table">
    <UiTitle>
      {{ t('backup-repositories') }}
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
        :no-data-message="backupRepositories.length === 0 ? t('no-backup-available') : undefined"
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
          <tr v-for="row of backupRepositoriesRecords" :key="row.id" class="typo-body-regular-small">
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <UiLink
                v-if="column.id == 'backup-repository'"
                size="medium"
                :icon="column.value.icon"
                :href="column.value.link"
              >
                {{ column.value.label }}
              </UiLink>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero
        v-if="searchQuery && filteredBackupRepositories.length === 0"
        format="table"
        type="no-result"
        size="small"
      >
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
import type { XoBackupRepository } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRepositories } = defineProps<{
  backupRepositories: XoBackupRepository[]
  isReady: boolean
  hasError: boolean
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredBackupRepositories = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupRepositories
  }

  return backupRepositories.filter(backupRepository =>
    Object.values(backupRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('backup-repositories', filteredBackupRepositories, {
  rowId: record => record.id,
  columns: define => [
    define(
      'backup-repository',
      record => ({
        label: record.name,
        link: '/#/settings/remotes',
        icon: getBackupRepositoryIcon(record),
      }),
      { label: t('backup-repository') }
    ),
  ],
})

const { pageRecords: backupRepositoriesRecords, paginationBindings } = usePagination('backup-repositories', rows)

type BackupRepositoryHeader = 'backup-repository'

const headerIcon: Record<BackupRepositoryHeader, IconName> = {
  'backup-repository': 'fa:a',
}

function getBackupRepositoryIcon(backupRepository: XoBackupRepository): IconName {
  return backupRepository.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
}
</script>

<style lang="postcss" scoped>
.backup-repositories-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-repositories-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
