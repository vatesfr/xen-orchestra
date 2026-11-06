<template>
  <div class="backup-job-source-pool-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="pool of paginatedPools" :key="pool.id">
          <BodyCells :item="pool" />
        </VtsRow>
      </tbody>
    </VtsTable>

    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>{{ errorMessage }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { useBackupJobIdSelection } from '@/modules/backup-job/composables/use-backup-job-id-selection.composable.ts'
import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import { usePoolQueryBuilder } from '@/modules/pool/composables/use-pool-query-builder.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { usePoolColumns } from '@core/tables/column-sets/pool-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pools, busy, error } = defineProps<{
  pools: FrontXoPool[]
  busy: boolean
  error?: InputWrapperMessage
}>()

const selectedIds = defineModel<FrontXoPool['id'][]>({ required: true })

const { t } = useI18n()

const {
  items: filteredPools,
  filter,
  schema,
} = usePoolQueryBuilder('backup-job-source-pools', () => pools, { ignoreRoute: true })

const { pageRecords: paginatedPools, paginationBindings } = usePagination('backup-job-source-pools', filteredPools, {
  ignoreRoute: true,
})

const { isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useBackupJobIdSelection(
  selectedIds,
  () => pools,
  filteredPools,
  paginatedPools
)

const state = useTableState({
  busy: () => busy,
  empty: () =>
    pools.length === 0 ? t('no-pools-detected') : filteredPools.value.length === 0 ? { type: 'no-result' } : false,
})

const errorMessage = computed(() => formatErrorMessage(error))

const { HeadCells, BodyCells } = usePoolColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (pool: FrontXoPool) => ({
    checkbox: r => r({ selected: isSelected(pool.id), onToggle: () => toggleSelection(pool.id) }),
    pool: r => r({ label: pool.name_label, to: `/pool/${pool.id}/dashboard`, icon: 'object:pool' }),
    description: r => r(pool.name_description),
    tags: r => r(pool.tags),
  }),
})
</script>

<style lang="postcss" scoped>
.backup-job-source-pool-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
