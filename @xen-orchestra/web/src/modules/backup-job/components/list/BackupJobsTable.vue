<template>
  <UiTitle>
    {{ t('backup-jobs') }}
  </UiTitle>
  <div class="search-and-filters">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <BackupJobsFilters :status-select-id :last-runs-status-select-id :last-days-status-select-id />
  </div>
  <BackupJobsBulkActions :backup-jobs="selectedBackupJobs" />

  <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow
        v-for="backupJob of paginatedBackupJobs"
        :key="backupJob.id"
        :selected="selectedBackupJobId === backupJob.id"
      >
        <BodyCells :item="backupJob" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import BackupJobsBulkActions from '@/modules/backup-job/components/list/BackupJobsBulkActions.vue'
import BackupJobsFilters from '@/modules/backup-job/components/list/BackupJobsFilters.vue'
import { useXoBackupJobActions } from '@/modules/backup-job/composables/use-xo-backup-job-actions.composable.ts'
import { useXoBackupJobFilters } from '@/modules/backup-job/composables/use-xo-backup-job-filters.composable.ts'
import { useXoBackupJobLastRuns } from '@/modules/backup-job/composables/use-xo-backup-job-last-runs.composable.ts'
import { useXoBackupJobModeLabel } from '@/modules/backup-job/composables/use-xo-backup-job-mode-label.composable.ts'
import { useXoBackupJobTypeLabels } from '@/modules/backup-job/composables/use-xo-backup-job-type-labels.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobHealthCheckStatus } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupJobColumns } from '@core/tables/column-sets/backup-job-columns.ts'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs, busy, error } = defineProps<{
  backupJobs: FrontAnyXoBackupJob[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { areBackupLogsReady } = useXoBackupLogCollection()

const { items: queryFilteredBackupJobs, filter } = useQueryBuilderFilter('backup-jobs', () => backupJobs)

const { filteredBackupJobs, statusSelectId, lastRunsStatusSelectId, lastDaysStatusSelectId } =
  useXoBackupJobFilters(queryFilteredBackupJobs)

const schema = useQueryBuilderSchema<FrontAnyXoBackupJob>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
})

const selectedBackupJobId = useRouteQuery('id')

const { pageRecords: paginatedBackupJobs, paginationBindings } = usePagination('backup-jobs', filteredBackupJobs)

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => backupJobs,
  filteredItems: filteredBackupJobs,
  pageItems: paginatedBackupJobs,
  getItemId: backupJob => backupJob.id,
})

const selectedBackupJobs = computed(() => backupJobs.filter(backupJob => selectedIds.value.includes(backupJob.id)))

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    backupJobs.length === 0
      ? t('no-backup-job-available')
      : filteredBackupJobs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const jobOverviewHref = computed(() => buildXo5Route('/backup/overview'))

const { HeadCells, BodyCells } = useBackupJobColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (backupJob: FrontAnyXoBackupJob) => {
    const typeLabels = useXoBackupJobTypeLabels(() => backupJob)
    const modeLabel = useXoBackupJobModeLabel(() => backupJob)
    const lastRuns = useXoBackupJobLastRuns(() => backupJob)
    const healthCheckStatus = computed(() => getBackupJobHealthCheckStatus(backupJob))

    const { isEnabled, moreActions, deleteAction } = useXoBackupJobActions(() => backupJob)

    return {
      checkbox: r =>
        r({
          selected: isSelected(backupJob.id),
          onToggle: () => toggleSelection(backupJob.id),
        }),
      backupJob: r =>
        r({
          label: backupJob.name ?? t('untitled'),
          href: jobOverviewHref.value,
          icon: 'object:backup-job',
        }),
      type: r => r(typeLabels.value[0] ?? '', { extraCount: typeLabels.value.length - 1 }),
      mode: r => r(modeLabel.value),
      lastRuns: r => (areBackupLogsReady.value ? r(lastRuns.value) : renderLoadingCell()),
      status: r => r(isEnabled.value),
      healthCheck: r => r(healthCheckStatus.value ?? []),
      actions: r =>
        r({
          onClick: () => (selectedBackupJobId.value = backupJob.id),
          actions: [...moreActions.value, deleteAction.value],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  @media (--large) {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    column-gap: 1.6rem;

    .vts-query-builder,
    .backup-jobs-filters {
      grid-column: 1 / -1;
    }

    .vts-query-builder {
      display: grid;
      grid-template-columns: subgrid;
    }
  }
}
</style>
