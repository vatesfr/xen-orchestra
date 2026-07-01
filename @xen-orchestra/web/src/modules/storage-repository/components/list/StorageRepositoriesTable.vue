<template>
  <div class="storage-repositories-table">
    <UiTitle>
      {{ t('storage-repositories') }}
      <template #action>
        <UiLink size="medium" :href>{{ t('configure-in-xo-5') }}</UiLink>
      </template>
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="sr of paginatedSrs" :key="sr.id" :selected="selectedSrId === sr.id">
            <BodyCells :key="getSrPbdsSignature(sr, scope)" :item="sr" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSrConnectModal } from '@/modules/storage-repository/composables/use-sr-connect-modal.composable.ts'
import { useSrDeleteModal } from '@/modules/storage-repository/composables/use-sr-delete-modal.composable.ts'
import { useSrDisconnectModal } from '@/modules/storage-repository/composables/use-sr-disconnect-modal.composable.ts'
import { useGetPbdsInScope, useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useSrColumns } from '@core/tables/column-sets/sr-columns.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  srs: rawSrs,
  scope,
  busy,
  error,
} = defineProps<{
  srs: FrontXoSr[]
  scope: SrScope
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route('/new/sr'))

const selectedSrId = useRouteQuery('id')

const { isDefaultSr } = useXoSrCollection()

const { filter, items: filteredSrs } = useQueryBuilderFilter('sr', () => rawSrs)

const schema = useQueryBuilderSchema<FrontXoSr>({
  '': useStringSchema(t('any-property')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  SR_type: useStringSchema(t('storage-format')),
  shared: useBooleanSchema(t('access-mode'), {
    true: t('shared'),
    false: t('local'),
  }),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawSrs.length === 0
      ? t('no-storage-repository-detected')
      : filteredSrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedSrs, paginationBindings } = usePagination('srs', filteredSrs)

const { getSrPbdsSignature } = useGetPbdsInScope()

function getPrimaryIcon(sr: FrontXoSr) {
  if (!isDefaultSr(sr)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('default-storage-repository'),
  }
}

const { HeadCells, BodyCells } = useSrColumns({
  body: (sr: FrontXoSr) => {
    const to = `/sr/${sr.id}`
    const rightIcon = computed(() => getPrimaryIcon(sr))

    const { srStatusIcon } = useXoSrUtils(sr, () => scope)

    const { openModal: openSrDeleteModal, canRun: canDeleteSr, isRunning: isDeletingSr } = useSrDeleteModal(() => [sr])

    const {
      openModal: openSrConnectModal,
      canRun: canConnectSr,
      isRunning: isConnectingSr,
      errorMessage: connectSrErrorMessage,
      targetCount: connectTargetCount,
    } = useSrConnectModal(
      () => [sr],
      () => scope
    )

    const {
      openModal: openSrDisconnectModal,
      canRun: canDisconnectSr,
      isRunning: isDisconnectingSr,
      errorMessage: disconnectSrErrorMessage,
      targetCount: disconnectTargetCount,
    } = useSrDisconnectModal(
      () => [sr],
      () => scope
    )

    const connectLabel = computed(() =>
      connectTargetCount.value > (scope.type === SR_SCOPE_TYPE.POOL ? 0 : 1)
        ? t('action:connect-n', { n: connectTargetCount.value })
        : t('action:connect')
    )

    const disconnectLabel = computed(() =>
      disconnectTargetCount.value > (scope.type === SR_SCOPE_TYPE.POOL ? 0 : 1)
        ? t('action:disconnect-n', { n: disconnectTargetCount.value })
        : t('action:disconnect')
    )

    return {
      storageRepository: r =>
        r({
          label: sr.name_label,
          to,
          icon: srStatusIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(sr.name_description),
      storageFormat: r => r(sr.SR_type),
      accessMode: r => r(sr.shared ? t('shared') : t('local')),
      usedSpace: r => r(sr.physical_usage, sr.size),
      actions: r =>
        r({
          onClick: () => (selectedSrId.value = sr.id),
          actions: [
            {
              label: connectLabel.value,
              icon: 'action:connect',
              onClick: () => openSrConnectModal(),
              busy: isConnectingSr.value,
              disabled: !canConnectSr.value,
              hint: connectSrErrorMessage.value,
            },
            {
              label: disconnectLabel.value,
              icon: 'action:disconnect',
              onClick: () => openSrDisconnectModal(),
              busy: isDisconnectingSr.value,
              disabled: !canDisconnectSr.value,
              hint: disconnectSrErrorMessage.value,
            },
            {
              label: t('action:delete'),
              icon: 'action:delete',
              onClick: () => openSrDeleteModal(),
              disabled: !canDeleteSr.value,
              busy: isDeletingSr.value,
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.storage-repositories-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.storage-repositories-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
