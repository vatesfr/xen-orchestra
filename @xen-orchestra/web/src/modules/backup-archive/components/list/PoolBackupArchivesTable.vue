<template>
  <UiTitle>
    {{ t('pool-metadata-backup-archives') }}
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
        v-for="backupArchive of paginatedBackupArchives"
        :key="backupArchive.id"
        :selected="selectedBackupArchiveId === backupArchive.id"
      >
        <BodyCells :item="backupArchive" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import type { PoolBackupArchiveFilterableData } from '@/modules/backup-archive/types/xo-backup-archive.type.ts'
import { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { usePoolBackupArchiveColumns } from '@core/tables/column-sets/pool-backup-archive-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoPoolBackupArchive } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupArchives, busy, error } = defineProps<{
  backupArchives: XoPoolBackupArchive[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const selectedBackupArchiveId = useRouteQuery('id')

const { getPoolById } = useXoPoolCollection()

const { getBackupJobById } = useXoBackupJobCollection()

const { getBackupRepositoryById } = useXoBackupRepositoryCollection()

const filterableBackupArchives = computed(() =>
  backupArchives.map(backupArchive => ({
    ...backupArchive,
    poolName: backupArchive.pool.name_label,
    backupRepositoryName: getBackupRepositoryById(backupArchive.backupRepository)?.name,
  }))
)

const { items: filteredBackupArchives, filter } = useQueryBuilderFilter<PoolBackupArchiveFilterableData>(
  'pool-backup-archives',
  () => filterableBackupArchives.value
)

const schema = useQueryBuilderSchema<PoolBackupArchiveFilterableData>({
  '': useStringSchema(t('any-property')),
  poolName: useStringSchema(t('pool')),
  jobName: useStringSchema(t('job')),
  backupRepositoryName: useStringSchema(t('backup-repository')),
})

const { pageRecords: paginatedBackupArchives, paginationBindings } = usePagination(
  'pool-backup-archives',
  filteredBackupArchives
)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    backupArchives.length === 0
      ? t('no-backup-archive-available')
      : filteredBackupArchives.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = usePoolBackupArchiveColumns({
  body: (backupArchive: PoolBackupArchiveFilterableData) => {
    const pool = computed(() => getPoolById(backupArchive.pool.uuid as FrontXoPool['id']))

    const job = computed(() => getBackupJobById(backupArchive.jobId))

    const br = computed(() => getBackupRepositoryById(backupArchive.backupRepository))

    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br.value)

    return {
      date: r => r(backupArchive.timestamp),
      pool: r =>
        pool.value !== undefined
          ? r({
              label: pool.value.name_label,
              to: { name: '/pool/[id]/dashboard', params: { id: pool.value.id } },
              icon: 'object:pool',
            })
          : r({ label: backupArchive.poolName, icon: 'object:pool' }),
      job: r =>
        job.value !== undefined
          ? r({
              label: job.value.name ?? t('untitled'),
              to: { name: '/admin/backup-and-replication/jobs', query: { id: job.value.id } },
              icon: 'object:backup-job',
            })
          : r({ label: backupArchive.jobName ?? backupArchive.jobId, icon: 'object:backup-job' }),
      backupRepository: r =>
        br.value !== undefined
          ? r({
              label: br.value.name,
              to: { name: '/admin/backup-repository/[id]/general', params: { id: br.value.id } },
              icon: getBackupRepositoryIcon(br.value, parsedBrUrl.value?.type),
            })
          : r({ label: backupArchive.backupRepository }),
      tags: r => r([]),
      selectItem: r => r(() => (selectedBackupArchiveId.value = backupArchive.id)),
    }
  },
})
</script>
