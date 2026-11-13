<template>
  <UiTitle>
    {{ t('vm-backup-archives') }}
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
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { VmBackupArchiveFilterableData } from '@/modules/backup-archive/types/xo-backup-archive.type.ts'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoVmOperationLabel } from '@/modules/vm/composables/xo-vm-operation-label.composable.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useVmBackupArchiveColumns } from '@core/tables/column-sets/vm-backup-archive-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupArchives, busy, error } = defineProps<{
  backupArchives: FrontXoVmBackupArchive[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const selectedBackupArchiveId = useRouteQuery('id')

const { getVmById } = useXoVmCollection()

const { getVmIconTooltip } = useXoVmOperationLabel()

const { getBackupRepositoryById } = useXoBackupRepositoryCollection()

const filterableBackupArchives = computed(() =>
  backupArchives.map(backupArchive => ({
    ...backupArchive,
    vmName: backupArchive.vm.name_label,
    backupRepositoryName: getBackupRepositoryById(backupArchive.backupRepository)?.name,
    tags: backupArchive.vm.tags,
  }))
)

const { items: filteredBackupArchives, filter } = useQueryBuilderFilter<VmBackupArchiveFilterableData>(
  'vm-backup-archives',
  () => filterableBackupArchives.value
)

const schema = useQueryBuilderSchema<VmBackupArchiveFilterableData>({
  '': useStringSchema(t('any-property')),
  vmName: useStringSchema(t('vm')),
  backupRepositoryName: useStringSchema(t('backup-repository')),
  tags: useStringSchema(t('tags')),
})

const { pageRecords: paginatedBackupArchives, paginationBindings } = usePagination(
  'vm-backup-archives',
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

const { HeadCells, BodyCells } = useVmBackupArchiveColumns({
  body: (backupArchive: VmBackupArchiveFilterableData) => {
    const vm = computed(() => getVmById(backupArchive.vm.uuid as FrontXoVm['id']))

    const br = computed(() => getBackupRepositoryById(backupArchive.backupRepository))

    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br.value)

    return {
      date: r => r(backupArchive.timestamp),
      vm: r =>
        vm.value !== undefined
          ? r({
              label: vm.value.name_label,
              to: { name: '/vm/[id]/dashboard', params: { id: vm.value.id } },
              icon: getVmIcon(vm.value),
              iconTooltip: getVmIconTooltip(vm.value),
            })
          : r({ label: backupArchive.vmName, icon: 'object:vm' }),
      backupRepository: r =>
        br.value !== undefined
          ? r({
              label: br.value.name,
              to: { name: '/admin/backup-repository/[id]/general', params: { id: br.value.id } },
              icon: getBackupRepositoryIcon(br.value, parsedBrUrl.value?.type),
            })
          : r({ label: backupArchive.backupRepository }),
      tags: r => r(backupArchive.tags),
      selectItem: r => r(() => (selectedBackupArchiveId.value = backupArchive.id)),
    }
  },
})
</script>
