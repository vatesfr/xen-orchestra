<template>
  <div class="backup-repositories-table">
    <UiTitle>
      {{ t('backup-repositories') }}
    </UiTitle>
    <div class="table-actions">
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
            <th v-if="column.id === 'checkbox'" class="checkbox">
              <div v-tooltip="t('coming-soon')">
                <UiCheckbox disabled accent="brand" />
              </div>
            </th>
            <th v-else-if="column.id === 'more'" class="more">
              <UiButtonIcon v-tooltip="t('coming-soon')" icon="fa:ellipsis" accent="brand" disabled size="small" />
            </th>
            <th v-else>
              <div v-tooltip class="text-ellipsis">
                <VtsIcon size="medium" :name="headerIcon[column.id]" />
                {{ column.label }}
              </div>
            </th>
          </template>
        </tr>
      </template>
      <template #tbody>
        <tr v-for="row of backupsRecords" :key="row.id" class="typo-body-regular-small">
          <td
            v-for="column of row.visibleColumns"
            :key="column.id"
            class="typo-body-regular-small"
            :class="{ checkbox: column.id === 'checkbox' }"
          >
            <div v-if="column.id === 'checkbox'" v-tooltip="t('coming-soon')">
              <UiCheckbox disabled accent="brand" :value="row.id" />
            </div>
            <UiButtonIcon
              v-else-if="column.id === 'more'"
              v-tooltip="t('coming-soon')"
              icon="fa:ellipsis"
              accent="brand"
              disabled
              size="small"
            />
            <UiLink v-if="column.id == 'title'" size="medium" :icon="column.value.icon" href="/#/settings/remotes">
              {{ column.value.label }}
            </UiLink>
          </td>
        </tr>
      </template>
    </VtsDataTable>
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
  </div>
</template>

<script setup lang="ts">
import type { XoBackupRepository } from '@/types/xo/br.type'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRepositoriesTargets } = defineProps<{
  backupRepositoriesTargets: XoBackupRepository[]
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredBackupRepository = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupRepositoriesTargets
  }

  return backupRepositoriesTargets.filter(storageRepository =>
    Object.values(storageRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('backup-repositories', filteredBackupRepository, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define(
      'title',
      record => ({
        label: record.name,
        id: record.id,
        icon: brIcon(record),
      }),
      { label: t('backup-repository') }
    ),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: backupsRecords, paginationBindings } = usePagination('backups-jobs', rows)

type backupRepositoryHeader = /* 'used-space' | 'remaning-space' | 'total-capacity' | */ 'title'

const headerIcon: Record<backupRepositoryHeader, IconName> = {
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
.backup-repositories-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .table-actions {
    gap: 0.8rem;
  }

  .checkbox,
  .more {
    width: 4.8rem;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }
}
</style>
