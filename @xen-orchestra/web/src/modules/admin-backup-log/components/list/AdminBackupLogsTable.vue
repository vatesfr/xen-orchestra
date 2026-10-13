<template>
  <UiTitle>
    {{ t('backup-logs') }}
  </UiTitle>
  <VtsQueryBuilder v-model="filter" :schema />

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
import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.js'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { objectIcon } from '@core/icons'
import { formatDate } from '@vueuse/core'
import VtsQueryBuilder from '@xen-orchestra/web-core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useRouteQuery } from '@xen-orchestra/web-core/composables/route-query.composable.ts'
import { useTableState } from '@xen-orchestra/web-core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@xen-orchestra/web-core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@xen-orchestra/web-core/packages/query-builder/use-query-builder-filter.ts'
import { useAdminBackupLogColumns } from '@xen-orchestra/web-core/tables/column-sets/admin-backup-log-columns.ts'
import { useStringSchema } from '@xen-orchestra/web-core/utils/query-builder/use-string-schema.ts'
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

    const vmTasks = computed(() => (log.tasks ?? []).filter(task => task.data?.type === 'VM'))

    const firstVm = computed(() => {
      const vmId = vmTasks.value[0]?.data!.id as FrontXoVm['id'] | undefined

      return vmId !== undefined ? getVmById(vmId) : undefined
    })

    const srIds = computed(() => [
      ...new Set(
        vmTasks.value.flatMap(vmTask =>
          (vmTask.tasks ?? []).filter(task => task.data?.type === 'SR').map(task => task.data!.id as FrontXoSr['id'])
        )
      ),
    ])

    const firstSrId = computed(() => srIds.value[0])

    const firstSr = computed(() => (firstSrId.value !== undefined ? getSrById(firstSrId.value) : undefined))

    return {
      job: r => r({ label: log.jobName ?? t('untitled'), href: href.value, icon: 'object:backup-job' }),
      backupDate: r => r(formatDate(new Date(log.start), 'YYYY-MM-DD HH:mm:ss')),
      vm: r =>
        firstVm.value !== undefined
          ? r({
              label: firstVm.value.name_label,
              to: { name: '/vm/[id]/dashboard', params: { id: firstVm.value.id } },
              icon: objectIcon('vm', toLower(firstVm.value.power_state)),
              extraCount: vmTasks.value.length - 1,
            })
          : r({ label: t('vm-not-found'), icon: 'status:warning-circle', extraCount: vmTasks.value.length - 1 }),
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
