<template>
  <UiTitle>
    {{ t('backup-repositories') }}
    <template #action>
      <slot name="title-actions" />
    </template>
  </UiTitle>
  <VtsQueryBuilder v-model="filter" :schema />
  <VtsTableBulkActions :actions="bulkActions" />

  <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="br of paginatedBrs" :key="br.id" :selected="selectedBrId === br.id">
        <BodyCells :item="br" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupRepositoryColumns } from '@core/tables/column-sets/backup-repository-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { brs, busy, error } = defineProps<{
  brs: FrontXoBackupRepository[]
  busy: boolean
  error: boolean
}>()

defineSlots<{
  'title-actions'?(): any
}>()

const { t } = useI18n()

const { useGetProxyById } = useXoProxyCollection()

const { openEditBackupRepositoryDrawer } = useEditBackupRepository()

const { items: filteredBrs, filter } = useQueryBuilderFilter('brs', () => brs)

const selectedBrId = useRouteQuery('id')

const { pageRecords: paginatedBrs, paginationBindings } = usePagination('brs', filteredBrs)

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => brs,
  filteredItems: brs,
  pageItems: paginatedBrs,
  getItemId: br => br.id,
})

const selectedBrs = computed(() => brs.filter(br => selectedIds.value.includes(br.id)))

const {
  run: connectBackupRepositories,
  canRun: canConnectBackupRepositories,
  isRunning: isConnectingBackupRepositories,
  errorMessage: connectBackupRepositoriesErrorMessage,
} = useXoBackupRepositoryChangeStateJob(selectedBrs, true)

const {
  run: disableBackupRepositories,
  canRun: canDisableBackupRepositories,
  isRunning: isDisablingBackupRepositories,
  errorMessage: disableBackupRepositoriesErrorMessage,
} = useXoBackupRepositoryChangeStateJob(selectedBrs, false)

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:change-state'),
    icon: 'action:change-state',
    disabled: selectedBrs.value.length === 0,
    children: [
      {
        label: t('action:connect'),
        icon: 'status:success-circle',
        onClick: () => connectBackupRepositories(),
        disabled: !canConnectBackupRepositories.value,
        busy: isConnectingBackupRepositories.value,
        hint: connectBackupRepositoriesErrorMessage.value,
      },
      {
        label: t('action:disable'),
        icon: 'status:disabled',
        onClick: () => disableBackupRepositories(),
        disabled: !canDisableBackupRepositories.value,
        busy: isDisablingBackupRepositories.value,
        hint: disableBackupRepositoriesErrorMessage.value,
      },
    ],
  },
])

const schema = useQueryBuilderSchema<FrontXoBackupRepository>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  url: useStringSchema(t('url')),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    brs.length === 0
      ? t('no-backup-repository-detected')
      : filteredBrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useBackupRepositoryColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (br: FrontXoBackupRepository) => {
    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)

    const typeLabel = useXoBackupRepositoryTypeLabel(() => parsedBrUrl.value?.type)

    const proxy = useGetProxyById(() => br.proxy)

    const { runBenchmark, canBenchmark, isBenchmarking, benchmarkErrorMessage } = useXoBackupRepositoryBenchmark(
      () => br
    )

    const {
      run: changeBackupRepositoriesState,
      canRun: canChangeBackupRepositoriesState,
      isRunning: isChangingBackupRepositoriesState,
      errorMessage: changeBackupRepositoriesStateErrorMessage,
    } = useXoBackupRepositoryChangeStateJob(
      () => [br],
      () => !br.enabled
    )

    const {
      forgetBackupRepositories,
      canForgetBackupRepositories,
      isForgettingBackupRepositories,
      forgetBackupRepositoriesErrorMessage,
    } = useBackupRepositoryForget(() => [br])

    return {
      checkbox: r =>
        r({
          selected: isSelected(br.id),
          onToggle: () => toggleSelection(br.id),
        }),
      backupRepository: r =>
        r({
          label: br.name,
          to: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
          icon: getBackupRepositoryIcon(br, parsedBrUrl.value?.type),
        }),
      status: r => r(getBackupRepositoryStatus(br)),
      type: r => r(typeLabel.value),
      proxy: r => {
        const proxyName = proxy.value?.name

        return proxyName ? r(proxyName, { leftIcon: { icon: 'object:proxy' } }) : r('')
      },
      actions: r =>
        r({
          onClick: () => (selectedBrId.value = br.id),
          actions: [
            {
              label: br.enabled ? t('action:disable') : t('action:connect'),
              icon: br.enabled ? 'status:disabled' : 'status:success-circle',
              onClick: () => changeBackupRepositoriesState(),
              disabled: !canChangeBackupRepositoriesState.value,
              busy: isChangingBackupRepositoriesState.value,
              hint: changeBackupRepositoriesStateErrorMessage.value,
            },
            {
              label: t('action:edit'),
              icon: 'action:edit',
              onClick: () => openEditBackupRepositoryDrawer(br),
            },
            {
              label: t('action:test-speed'),
              icon: 'action:scan',
              onClick: () => runBenchmark(),
              disabled: !canBenchmark.value,
              busy: isBenchmarking.value,
              hint: benchmarkErrorMessage.value,
            },
            {
              label: t('action:forget'),
              icon: 'action:forget',
              onClick: () => forgetBackupRepositories(),
              disabled: !canForgetBackupRepositories.value,
              busy: isForgettingBackupRepositories.value,
              hint: forgetBackupRepositoriesErrorMessage.value,
              accent: 'danger',
              separator: true,
            },
          ],
        }),
    }
  },
})
</script>
