<template>
  <UiCard class="backup-job-schedules-table">
    <UiTitle>{{ t('schedules') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        is-ready
        :has-error
        :no-data-message="backupJobSchedules.length === 0 ? t('no-backup-available') : undefined"
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
                <div v-tooltip>
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of backupJobSchedulesRecords"
            :key="row.id"
            :class="{ selected: selectedBackupJobId === row.id }"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" :class="{ checkbox: column.id === 'checkbox' }">
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
              <div v-else-if="column.id === 'schedule'">
                <UiLink size="medium" icon="object:backup-job" :href="`/#/backup/${column.value.jobId}/edit`">
                  {{ column.value.name }}
                </UiLink>
              </div>
              <template v-else-if="column.id === 'status'">
                <VtsEnabledState :enabled="column.value ?? false" />
              </template>
              <template v-else-if="column.id === 'last-runs'">
                <ul class="last-three-runs">
                  <li v-for="(status, index) in column.value" :key="index" v-tooltip="status.tooltip">
                    <VtsIcon size="medium" :name="status.icon" />
                    <span class="visually-hidden">{{ t('last-run-number', { n: index + 1 }) }}</span>
                  </li>
                </ul>
              </template>
              <div v-else v-tooltip class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero
        v-if="searchQuery && filteredBackupJobsSchedules.length === 0"
        format="table"
        type="no-result"
        size="small"
      >
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobSchedulesUtils } from '@/composables/xo-backup-job-schedules.composable'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { XoSchedule } from '@vates/types'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobSchedules } = defineProps<{
  backupJobSchedules: XoSchedule[]
  hasError: boolean
}>()

const { t } = useI18n()

const { useGetBackupJobById } = useXoBackupJobCollection()
const { getLastThreeRunsStatuses } = useXoBackupJobSchedulesUtils()

const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupJobsSchedules = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupJobSchedules
  }

  return backupJobSchedules.filter(schedules =>
    Object.values(schedules).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('backup-job-schedules', filteredBackupJobsSchedules, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('schedule', record => record, { label: t('schedule') }),
    define('id', record => record.id, { label: t('id') }),
    define('status', record => record.enabled, { label: t('status') }),
    define('cron-pattern', record => record.cron, { label: t('cron-pattern') }),
    define('last-runs', record => getLastThreeRunsStatuses(useGetBackupJobById(record.jobId).value), {
      label: t('last-n-runs', { n: 3 }),
    }),
    // define('next-run', () => 'comming soon', { label: t('next-run') }), // #TODO bad data
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: backupJobSchedulesRecords, paginationBindings } = usePagination('backup-job-schedules', rows)

type BackupJobHeader = 'schedule' | 'id' | 'status' | 'cron-pattern' | 'last-runs'

const headerIcon: Record<BackupJobHeader, IconName> = {
  schedule: 'fa:a',
  id: 'fa:hashtag',
  status: 'fa:square-caret-down',
  'cron-pattern': 'fa:clock',
  'last-runs': 'fa:square-caret-down',
  // 'next-run': 'fa:calendar',
}
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
