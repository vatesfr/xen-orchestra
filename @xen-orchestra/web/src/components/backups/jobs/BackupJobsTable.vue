<template>
  <div class="backup-jobs-table">
    <UiTitle>
      {{ t('backup-jobs') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTableNew :busy="!isReady" :error="hasError" :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="job of paginatedBackupJobs" :key="job.id" :selected="selectedBackupJobId === job.id">
            <BodyCells :item="job" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useBackupJobColumns } from '@core/tables/column-sets/backup-job-columns'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell'
import type { AnyXoBackupJob } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs: rawBackupJobs } = defineProps<{
  backupJobs: AnyXoBackupJob[]
  isReady: boolean
  hasError: boolean
}>()

const { t } = useI18n()

const { schedulesByJobId, areSchedulesReady } = useXoScheduleCollection()
const { getLastNBackupLogsByJobId, areBackupLogsReady } = useXoBackupLogCollection()

const { getModeLabels } = useXoBackupUtils()
const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupJobs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawBackupJobs
  }

  return rawBackupJobs.filter(backupJob =>
    Object.values(backupJob).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getLastThreeRunsStatuses = (backupJob: AnyXoBackupJob) =>
  getLastNBackupLogsByJobId(backupJob.id).map(backupLog => backupLog.status)

const getTotalSchedules = (backupJob: AnyXoBackupJob) => schedulesByJobId.value.get(backupJob.id)?.length ?? 0

const { pageRecords: paginatedBackupJobs, paginationBindings } = usePagination('backups-jobs', filteredBackupJobs)

const { HeadCells, BodyCells } = useBackupJobColumns({
  body: (job: AnyXoBackupJob) => {
    return {
      job: r =>
        r({
          label: job.name ?? '',
          to: `/backup/${job.id}/runs`,
          icon: 'object:backup-job',
        }),
      mode: r => r(getModeLabels(job)),
      lastRuns: r => (areBackupLogsReady.value ? r(getLastThreeRunsStatuses(job)) : renderLoadingCell()),
      schedules: r => (areSchedulesReady.value ? r(getTotalSchedules(job)) : renderLoadingCell()),
      selectId: r => r(() => (selectedBackupJobId.value = job.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.backup-jobs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-jobs-table {
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

  .mode {
    max-width: fit-content;
  }

  .last-three-runs {
    display: flex;
    gap: 0.8rem;
    align-items: center;

    li:not(:first-child) {
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: scale(1.3);
      }
    }

    /* Order of selectors matters
    *  because when there is only one item, it is both the first and the last child
    *  and we want to apply the first-child style in that case
    **/
    li:last-child {
      transform: scale(0.8);

      &::after {
        transform: scale(1.6);
      }
    }

    li:first-child {
      transform: scale(1.2);
      margin-inline-end: 0.3rem;
    }
  }

  .modes {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;

    .more-info {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .schedules {
    text-align: right;
  }
}
</style>
