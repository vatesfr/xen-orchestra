<template>
  <UiTitle>
    {{ t('backup-jobs') }}
  </UiTitle>
  <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

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
import { getBackupJobHealthCheckStatus } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
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

const { items: filteredBackupJobs, filter } = useQueryBuilderFilter('backup-jobs', () => backupJobs)

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
