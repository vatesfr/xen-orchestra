<template>
  <UiTitle>
    {{ t('backup-logs') }}
  </UiTitle>
  <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="log of paginatedBackupLogs" :key="log.id" :selected="selectedBackupLogId === log.id">
        <BodyCells :item="log" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { BackupLogFilterableData } from '@/modules/backup-log/types/xo-backup-log.type.ts'
import { getBackupLogSrIds, getBackupLogVmIds } from '@/modules/backup-log/utils/xo-backup-log.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupLogColumns } from '@core/tables/column-sets/backup-log-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLogs, busy, error } = defineProps<{
  backupLogs: FrontXoBackupLog[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const selectedBackupLogId = useRouteQuery('id')

const { getBackupJobById } = useXoBackupJobCollection()

const { getVmById } = useXoVmCollection()

const { getSrById } = useXoSrCollection()

const { getSrStatusIcon } = useXoSrUtils()

const filterableBackupLogs = computed(() =>
  backupLogs.map(log => ({ ...log, jobName: getBackupJobById(log.jobId)?.name }))
)

const { items: filteredBackupLogs, filter } = useQueryBuilderFilter<BackupLogFilterableData>(
  'backup-logs',
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

const { pageRecords: paginatedBackupLogs, paginationBindings } = usePagination('backup-logs', filteredBackupLogs)

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

const { HeadCells, BodyCells } = useBackupLogColumns({
  body: (log: BackupLogFilterableData) => {
    const href = computed(() => buildXo5Route(`/backup/${log.jobId}/edit`))

    const vmIds = computed(() => getBackupLogVmIds(log))

    const firstVm = computed(() => getVmById(vmIds.value[0]))

    const isVmExpected = computed(() => vmIds.value.length > 0 || getBackupJobById(log.jobId)?.type === 'backup')

    const srIds = computed(() => getBackupLogSrIds(log))

    const firstSrId = computed(() => srIds.value[0])

    const firstSr = computed(() => (firstSrId.value !== undefined ? getSrById(firstSrId.value) : undefined))

    return {
      job: r => r({ label: log.jobName ?? t('untitled'), href: href.value, icon: 'object:backup-job' }),
      backupDate: r => r(log.start),
      vm: r => {
        if (firstVm.value !== undefined) {
          return r({
            label: firstVm.value.name_label,
            to: { name: '/vm/[id]/dashboard', params: { id: firstVm.value.id } },
            icon: objectIcon('vm', toLower(firstVm.value.power_state)),
            extraCount: vmIds.value.length - 1,
          })
        }

        if (isVmExpected.value) {
          return r({ label: t('vm-not-found'), icon: 'status:warning-circle', extraCount: vmIds.value.length - 1 })
        }

        return r({ label: '' })
      },
      sr: r =>
        firstSr.value !== undefined
          ? r({
              label: firstSr.value.name_label,
              to: { name: '/sr/[id]/general', params: { id: firstSr.value.id } },
              icon: getSrStatusIcon(firstSr.value),
              extraCount: srIds.value.length - 1,
            })
          : r({ label: firstSrId.value ?? '', extraCount: srIds.value.length - 1 }),
      status: r => r(log.status),
      selectItem: r => r(() => (selectedBackupLogId.value = log.id)),
    }
  },
})
</script>
