<template>
  <div class="storage-repositories-table">
    <UiTitle>
      {{ t('storage-repositories') }}
      <template #actions>
        <UiLink size="medium" href="/#/backup/new">{{ t('configure-in-xo-5') }}</UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable :is-ready :has-error :no-data-message="srs.length === 0 ? t('no-backup-available') : undefined">
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
            v-for="row of srsRecords"
            :key="row.id"
            :class="{ selected: selectedSrId === row.id }"
            @click="selectedSrId = row.id"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <div v-if="column.id === 'name'" class="name">
                <UiLink
                  v-tooltip
                  size="medium"
                  icon="object:sr:muted"
                  :href="`/#/srs/${row.id}/general`"
                  class="text-ellipsis"
                  @click.stop
                >
                  {{ column.value.name }}
                </UiLink>
                <VtsIcon
                  v-if="column.value.isDefaultSr"
                  v-tooltip="t('default-storage-repository')"
                  name="legacy:primary"
                  size="current"
                />
              </div>
              <template v-else-if="column.id === 'used-space'">
                <StorageRepositorySizeProgressCell :current="column.value.used" :total="column.value.total" />
              </template>
              <div v-else v-tooltip class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredSrs.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import StorageRepositorySizeProgressCell from '@/components/storage-repositories/table/StorageRepositorySizeProgressCell.vue'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { XoSr } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { srs } = defineProps<{
  srs: XoSr[]
  hasError: boolean
  isReady: boolean
}>()

const { t } = useI18n()

const selectedSrId = useRouteQuery('id')

const { isDefaultSr } = useXoSrCollection()

const searchQuery = ref('')

const filteredSrs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return srs
  }

  return srs.filter(sr => Object.values(sr).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const { visibleColumns, rows } = useTable('backup-jobs', filteredSrs, {
  rowId: record => record.id,
  columns: define => [
    define('name', record => ({ name: record.name_label, isDefaultSr: isDefaultSr(record) }), {
      label: t('storage-repository'),
    }),
    define('description', record => record.name_description, { label: t('description') }),
    define('storage-format', record => record.SR_type, { label: t('storage-format') }),
    define('access-mode', record => (record.shared ? t('shared') : t('local')), { label: t('access-mode') }),
    define('used-space', record => ({ used: record.physical_usage, total: record.size }), { label: t('used-space') }),
  ],
})

const { pageRecords: srsRecords, paginationBindings } = usePagination('srs', rows)

type BackupJobHeader = 'name' | 'description' | 'storage-format' | 'access-mode' | 'used-space'

const headerIcon: Record<BackupJobHeader, IconName> = {
  name: 'fa:a',
  description: 'fa:align-left',
  'storage-format': 'fa:square-caret-down',
  'access-mode': 'fa:square-caret-down',
  'used-space': 'fa:hashtag',
}
</script>

<style scoped lang="postcss">
.storage-repositories-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.storage-repositories-table {
  gap: 2.4rem;

  .container,
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

  .name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
