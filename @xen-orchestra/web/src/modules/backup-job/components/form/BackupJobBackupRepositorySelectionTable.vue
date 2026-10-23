<template>
  <div class="backup-job-backup-repository-selection-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="br of paginatedBrs" :key="br.id">
          <BodyCells :item="br" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupRepositoryColumns } from '@core/tables/column-sets/backup-repository-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  backupRepositories: brs,
  areBackupRepositoriesReady,
  hasBackupRepositoryFetchError,
} = useXoBackupRepositoryCollection()

const { items: filteredBrs, filter } = useQueryBuilderFilter('backup-job-brs', brs, { ignoreRoute: true })

const schema = useQueryBuilderSchema<FrontXoBackupRepository>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  url: useStringSchema(t('url')),
})

const { pageRecords: paginatedBrs, paginationBindings } = usePagination('backup-job-brs', filteredBrs, {
  ignoreRoute: true,
})

const { pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: brs,
  filteredItems: filteredBrs,
  pageItems: paginatedBrs,
  getItemId: br => br.id,
})

const state = useTableState({
  busy: () => !areBackupRepositoriesReady.value,
  error: () => hasBackupRepositoryFetchError.value,
  empty: () =>
    brs.value.length === 0
      ? t('no-backup-repository-detected')
      : filteredBrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useBackupRepositoryColumns({
  exclude: ['proxy', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (br: FrontXoBackupRepository) => {
    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
    const typeLabel = useXoBackupRepositoryTypeLabel(() => parsedBrUrl.value?.type)

    return {
      checkbox: r => r({ selected: isSelected(br.id), onToggle: () => toggleSelection(br.id) }),
      backupRepository: r =>
        r({
          label: br.name,
          to: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
          icon: getBackupRepositoryIcon(br, parsedBrUrl.value?.type),
        }),
      status: r => r(getBackupRepositoryStatus(br)),
      type: r => r(typeLabel.value),
    }
  },
})
</script>

<style scoped lang="postcss">
.backup-job-backup-repository-selection-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
