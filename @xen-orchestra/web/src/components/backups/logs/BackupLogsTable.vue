<template>
  <div class="backup-logs-table">
    <UiTitle>
      {{ t('runs') }}
      <template #actions>
        <UiLink size="medium" href="/#/backup/new">{{ t('configure-in-xo-5') }}</UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTable :busy="!isReady" :error="hasError" :empty="emptyMessage" sticky="right" :pagination-bindings>
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="log of paginatedBackupLogs" :key="log.id" :selected="log.id === selectedBackupLogId">
            <BodyCells :item="log" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupLogsUtils } from '@/composables/xo-backup-log-utils.composable'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useBackupLogsColumns } from '@core/tables/column-sets/backup-log-columns'
import type { XoBackupLog } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLogs: rawBackupLogs } = defineProps<{
  backupLogs: XoBackupLog[]
  hasError: boolean
  isReady: boolean
}>()

const { t } = useI18n()

const selectedBackupLogId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupLogs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawBackupLogs
  }

  return rawBackupLogs.filter(backupLog =>
    Object.values(backupLog).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const emptyMessage = computed(() => {
  if (rawBackupLogs.length === 0) {
    return t('no-backup-run-available')
  }

  if (filteredBackupLogs.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { getBackupLogDuration, getTransferSize } = useXoBackupLogsUtils()

const { pageRecords: paginatedBackupLogs, paginationBindings } = usePagination('backups-logs', filteredBackupLogs)

const { HeadCells, BodyCells } = useBackupLogsColumns({
  body: (log: XoBackupLog) => {
    const transferSize = computed(() => getTransferSize(log))
    const duration = computed(() => getBackupLogDuration(log))

    return {
      startDate: r => r(log.start),
      endDate: r => r(log.end),
      duration: r => r(duration.value),
      status: r => r(log.status),
      transferSize: r => r(transferSize.value?.value, transferSize.value?.prefix),
      selectItem: r => r(() => (selectedBackupLogId.value = log.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.backup-logs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-logs-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
