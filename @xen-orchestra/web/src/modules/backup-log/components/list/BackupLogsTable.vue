<template>
  <UiTitle>
    {{ t('backup-logs') }}
  </UiTitle>
  <VtsQueryBuilder v-model="filter" :schema />

  <VtsTable :state :pagination-bindings>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="log of paginatedBackupLogs" :key="log.id">
        <BodyCells :item="log" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.js'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.js'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.js'
import { formatDate } from '@vueuse/core'
import VtsQueryBuilder from '@xen-orchestra/web-core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useTableState } from '@xen-orchestra/web-core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@xen-orchestra/web-core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@xen-orchestra/web-core/packages/query-builder/use-query-builder-filter.ts'
import { useAdminBackupLogColumns } from '@xen-orchestra/web-core/tables/column-sets/admin-backup-log-columns.ts'
import { useStringSchema } from '@xen-orchestra/web-core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLogs, busy, error } = defineProps<{
  backupLogs: FrontXoBackupLog[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { getBackupJobById } = useXoBackupJobCollection()

type BackupLogFilterableData = FrontXoBackupLog & { jobName: string | undefined }

const filterableBackupLogs = computed(() =>
  backupLogs.map(log => ({ ...log, jobName: getBackupJobById(log.jobId)?.name }))
)

const { items: filteredBackupLogs, filter } = useQueryBuilderFilter<BackupLogFilterableData>(
  'admin-backup-logs',
  () => filterableBackupLogs.value
)

const schema = useQueryBuilderSchema<BackupLogFilterableData>({
  '': useStringSchema(t('any-property')),
  jobName: useStringSchema(t('job')),
  status: useStringSchema(t('status'), {
    success: t('success'),
    skipped: t('skipped'),
    interrupted: t('interrupted'),
    failure: t('failure'),
    pending: t('pending'),
  }),
})

const { pageRecords: paginatedBackupLogs, paginationBindings } = usePagination('admin-backup-logs', filteredBackupLogs)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    backupLogs.length === 0
      ? t('no-backup-run-available')
      : filteredBackupLogs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useAdminBackupLogColumns({
  body: (log: BackupLogFilterableData) => {
    const href = computed(() => buildXo5Route(`/backup/${log.jobId}/edit`))

    return {
      job: r => r({ label: log.jobName ?? t('untitled'), href: href.value, icon: 'object:backup-job' }),
      backupDate: r => r(formatDate(new Date(log.start), 'YYYY-MM-DD HH:mm:ss')),
      vm: r => r(''),
      sr: r => r(''),
      status: r => r(log.status),
    }
  },
})
</script>
