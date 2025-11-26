<template>
  <UiCard class="backup-job-schedules-table">
    <UiTitle>{{ t('schedules') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTableNew :busy="!isReady" :error="hasError" :pagination-bindings>
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="schedule of paginatedSchedules" :key="schedule.id">
            <BodyCells :item="schedule" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobSchedulesUtils } from '@/composables/xo-backup-job-schedules.composable'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useBackupJobScheduleColumns } from '@core/tables/column-sets/backup-job-schedule-columns'
import type { XoSchedule } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobSchedules: rawSchedules } = defineProps<{
  backupJobSchedules: XoSchedule[]
  hasError: boolean
  isReady: boolean
}>()

const { t } = useI18n()

const { getBackupJobById } = useXoBackupJobCollection()
const { getLastThreeRunsStatuses } = useXoBackupJobSchedulesUtils()

const searchQuery = ref('')

const filteredSchedules = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawSchedules
  }

  return rawSchedules.filter(schedules =>
    Object.values(schedules).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { pageRecords: paginatedSchedules, paginationBindings } = usePagination('backup-job-schedules', filteredSchedules)

const { HeadCells, BodyCells } = useBackupJobScheduleColumns({
  body: (schedule: XoSchedule) => {
    const job = computed(() => getBackupJobById(schedule.jobId))

    return {
      id: r => r(schedule.id),
      backupJob: r => r({ label: job.value?.name ?? '', icon: 'object:backup-job' }),
      status: r => r(schedule.enabled),
      cronPattern: r => r(schedule.cron),
      lastThreeRuns: r => r(getLastThreeRunsStatuses(job.value)),
    }
  },
})
</script>

<style lang="postcss" scoped>
.backup-job-schedules-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-job-schedules-table {
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

  .last-three-runs {
    display: flex;
    gap: 0.8rem;

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
}
</style>
