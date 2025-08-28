<template>
  <div class="backup-jobs-table">
    <UiTitle>
      {{ t('backup-jobs') }}
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
      <VtsDataTable
        is-ready
        :has-error
        :no-data-message="backupJobs.length === 0 ? t('no-backup-available') : undefined"
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
            v-for="row of backupJobsRecords"
            :key="row.id"
            :class="{ selected: selectedBackupJobId === row.id }"
            @click="selectedBackupJobId = row.id"
          >
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ checkbox: column.id === 'checkbox' }"
            >
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
              <div v-else-if="column.id === 'job-name'">
                <UiLink size="medium" icon="fa:floppy-disk" @click.stop>
                  {{ column.value }}
                </UiLink>
              </div>
              <UiTagsList v-else-if="column.id === 'mode'">
                <template v-for="(backupMode, index) in column.value" :key="index">
                  <UiTag v-if="backupMode !== undefined" variant="secondary" accent="info" class="mode">
                    {{ backupMode }}
                  </UiTag>
                </template>
              </UiTagsList>
              <template v-else-if="column.id === 'last-runs'">
                <ul class="last-three-runs">
                  <li v-for="(status, index) in column.value" :key="index" v-tooltip="status.tooltip">
                    <VtsIcon size="medium" :name="status.icon" />
                  </li>
                </ul>
              </template>
              <div v-else-if="column.id === 'schedules'" class="schedules">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredBackupJobs.length === 0" type="table" image="no-result">
        <div>{{ t('no-result') }}</div>
      </VtsStateHero>
      <VtsStateHero v-if="!backupJobs.length" image="no-data" type="page" />
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { createMapper } from '@core/packages/mapper'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs } = defineProps<{
  backupJobs: XoBackupJob[]
  hasError: boolean
}>()

const { t } = useI18n()

const { schedulesByJobId } = useXoScheduleCollection()
const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()
const { getModeLabels } = useXoBackupUtils()

const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupJobs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupJobs
  }

  return backupJobs.filter(backupJob =>
    Object.values(backupJob).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getRunStatus = createMapper<XoBackupLog['status'], { icon: IconName; tooltip: string }>(
  {
    success: { icon: 'legacy:status:success', tooltip: t('success') },
    skipped: { icon: 'legacy:status:warning', tooltip: t('skipped') },
    interrupted: { icon: 'legacy:status:danger', tooltip: t('interrupted') },
    failure: { icon: 'legacy:status:danger', tooltip: t('failure') },
    pending: { icon: 'legacy:status:info', tooltip: t('in-progress') },
  },
  'failure'
)

const getLastThreeRunsStatuses = (backupJob: XoBackupJob) =>
  getLastNBackupLogsByJobId(backupJob.id).map(backupLog => getRunStatus(backupLog.status))

const getTotalSchedules = (backupJob: XoBackupJob) => schedulesByJobId.value.get(backupJob.id)?.length ?? 0

const { visibleColumns, rows } = useTable('backup-jobs', filteredBackupJobs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('job-name', record => record.name, { label: t('job-name') }),
    define('mode', record => getModeLabels(record), { label: t('mode') }),
    define('last-runs', record => getLastThreeRunsStatuses(record), {
      label: t('last-n-runs', { n: 3 }),
    }),
    define('schedules', record => getTotalSchedules(record), { label: t('total-schedules') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: backupJobsRecords, paginationBindings } = usePagination('backups-jobs', rows)

type BackupJobHeader = 'job-name' | 'mode' | 'last-runs' | 'schedules'

const headerIcon: Record<BackupJobHeader, IconName> = {
  'job-name': 'fa:align-left',
  mode: 'fa:square-caret-down',
  'last-runs': 'fa:square-caret-down',
  schedules: 'fa:hashtag',
}
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
  }

  .schedules {
    text-align: right;
  }
}
</style>
