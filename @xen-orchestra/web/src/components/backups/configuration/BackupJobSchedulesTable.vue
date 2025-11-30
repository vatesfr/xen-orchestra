<template>
  <UiCard class="backup-job-schedules-table">
    <UiTitle>{{ t('schedules') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTable :busy :error :empty="emptyMessage" :pagination-bindings>
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
      </VtsTable>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobSchedulesUtils } from '@/composables/xo-backup-job-schedules.composable'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
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
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { getBackupJobById } = useXoBackupJobCollection()
const { getLastThreeRunsStatuses } = useXoBackupJobSchedulesUtils()
const { buildXo5Route } = useXoRoutes()

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

const emptyMessage = computed(() => {
  if (rawSchedules.length === 0) {
    return t('no-schedule-available')
  }

  if (filteredSchedules.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { pageRecords: paginatedSchedules, paginationBindings } = usePagination('backup-job-schedules', filteredSchedules)

const { HeadCells, BodyCells } = useBackupJobScheduleColumns({
  body: (schedule: XoSchedule) => {
    const job = computed(() => getBackupJobById(schedule.jobId))
    const href = computed(() => buildXo5Route(`/backup/${schedule.jobId}/edit`))
    const lastRuns = computed(() => getLastThreeRunsStatuses(job.value))

    return {
      schedule: r =>
        r({
          label: schedule.name || t('untitled'),
          icon: 'object:backup-schedule',
          href: href.value,
        }),
      id: r => r(schedule.id),
      status: r => r(schedule.enabled),
      cronPattern: r => r(schedule.cron),
      lastThreeRuns: r => r(lastRuns.value),
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
}
</style>
