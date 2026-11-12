<template>
  <UiTitle>
    {{ t('backup-jobs') }}
  </UiTitle>
  <div class="search-and-filters">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <div class="filters">
      <UiDropdownButton
        v-if="uiStore.isSmall"
        :selected="areFiltersOpen"
        size="small"
        variant="secondary"
        @click="areFiltersOpen = !areFiltersOpen"
      >
        {{ t('filters') }}
      </UiDropdownButton>
      <UiActionsTitle v-else>{{ t('filters') }}</UiActionsTitle>
      <div v-if="!uiStore.isSmall || areFiltersOpen" class="filter-selects">
        <VtsFilterSelect :id="statusSelectId">{{ t('status') }}</VtsFilterSelect>
        <VtsFilterSelect :id="lastRunsStatusSelectId">
          {{ t('last-n-runs', BACKUP_JOB_LAST_RUNS_COUNT) }}
        </VtsFilterSelect>
        <VtsFilterSelect :id="lastDaysStatusSelectId">{{ t('last-n-days', LAST_DAYS_COUNT) }}</VtsFilterSelect>
      </div>
    </div>
  </div>

  <VtsTable :state :pagination-bindings sticky="right">
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
import { useXoBackupJobLastRuns } from '@/modules/backup-job/composables/use-xo-backup-job-last-runs.composable.ts'
import { useXoBackupJobModeLabel } from '@/modules/backup-job/composables/use-xo-backup-job-mode-label.composable.ts'
import { useXoBackupJobTypeLabels } from '@/modules/backup-job/composables/use-xo-backup-job-type-labels.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import {
  BACKUP_JOB_LAST_RUNS_COUNT,
  type BackupLogsStatus,
  getBackupJobHealthCheckStatus,
  getBackupLogsStatus,
} from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsFilterSelect from '@core/components/select/VtsFilterSelect.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useBackupJobColumns } from '@core/tables/column-sets/backup-job-columns.ts'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs, busy, error } = defineProps<{
  backupJobs: FrontAnyXoBackupJob[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const areFiltersOpen = ref(false)

const { buildXo5Route } = useXoRoutes()

const { areBackupLogsReady, backupLogsByJobId } = useXoBackupLogCollection()

const { schedulesByJobId } = useXoScheduleCollection()

const { items: queryFilteredBackupJobs, filter } = useQueryBuilderFilter('backup-jobs', () => backupJobs)

const { id: statusSelectId, selectedValues: selectedStatuses } = useFormSelect(['enabled', 'disabled'] as const, {
  multiple: true,
  option: { label: status => t(status) },
})

const LAST_DAYS_COUNT = 7

const BACKUP_LOGS_STATUSES: BackupLogsStatus[] = ['success', 'skipped', 'failure', 'no-run']

const backupLogsStatusLabels = computed<Record<BackupLogsStatus, string>>(() => ({
  success: t('backups:jobs:running-good'),
  skipped: t('backups:jobs:skipped-runs'),
  failure: t('backups:jobs:errors-detected'),
  'no-run': t('no-run'),
}))

const { id: lastRunsStatusSelectId, selectedValues: selectedLastRunsStatuses } = useFormSelect(BACKUP_LOGS_STATUSES, {
  multiple: true,
  option: { label: status => backupLogsStatusLabels.value[status] },
})

const { id: lastDaysStatusSelectId, selectedValues: selectedLastDaysStatuses } = useFormSelect(BACKUP_LOGS_STATUSES, {
  multiple: true,
  option: { label: status => backupLogsStatusLabels.value[status] },
})

function isSelected<TValue>(selectedValues: TValue[], value: TValue) {
  return selectedValues.length === 0 || selectedValues.includes(value)
}

const filteredBackupJobs = computed(() => {
  const lastDaysStart = new Date()
  lastDaysStart.setDate(lastDaysStart.getDate() - LAST_DAYS_COUNT)
  lastDaysStart.setHours(0, 0, 0, 0)

  return queryFilteredBackupJobs.value.filter(backupJob => {
    const isEnabled = schedulesByJobId.value.get(backupJob.id)?.some(schedule => schedule.enabled) ?? false

    const finishedBackupLogs = (backupLogsByJobId.value.get(backupJob.id) ?? []).filter(
      backupLog => backupLog.status !== 'pending'
    )

    const lastRunsStatus = getBackupLogsStatus(finishedBackupLogs.slice(0, BACKUP_JOB_LAST_RUNS_COUNT))

    const lastDaysStatus = getBackupLogsStatus(
      finishedBackupLogs.filter(backupLog => backupLog.start > lastDaysStart.getTime())
    )

    return (
      isSelected(selectedStatuses.value, isEnabled ? 'enabled' : 'disabled') &&
      isSelected(selectedLastRunsStatuses.value, lastRunsStatus) &&
      isSelected(selectedLastDaysStatuses.value, lastDaysStatus)
    )
  })
})

const schema = useQueryBuilderSchema<FrontAnyXoBackupJob>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
})

const selectedBackupJobId = useRouteQuery('id')

const { pageRecords: paginatedBackupJobs, paginationBindings } = usePagination('backup-jobs', filteredBackupJobs)

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
  body: (backupJob: FrontAnyXoBackupJob) => {
    const typeLabels = useXoBackupJobTypeLabels(() => backupJob)
    const modeLabel = useXoBackupJobModeLabel(() => backupJob)
    const lastRuns = useXoBackupJobLastRuns(() => backupJob)
    const healthCheckStatus = computed(() => getBackupJobHealthCheckStatus(backupJob))

    return {
      backupJob: r =>
        r({
          label: backupJob.name ?? t('untitled'),
          href: jobOverviewHref.value,
          icon: 'object:backup-job',
        }),
      type: r => r(typeLabels.value[0] ?? '', { extraCount: typeLabels.value.length - 1 }),
      mode: r => r(modeLabel.value),
      lastRuns: r => (areBackupLogsReady.value ? r(lastRuns.value) : renderLoadingCell()),
      healthCheck: r => r(healthCheckStatus.value ?? []),
      selectItem: r => r(() => (selectedBackupJobId.value = backupJob.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .filters {
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }

  .filter-selects {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  @media (--small) {
    .filters,
    .filter-selects {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (--large) {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    column-gap: 1.6rem;

    .vts-query-builder,
    .filters {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
    }

    .filter-selects {
      grid-column: 2 / -1;
    }
  }
}
</style>
