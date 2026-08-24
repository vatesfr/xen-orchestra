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
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import { useSrDelete } from '@/modules/storage-repository/composables/use-sr-delete.composable.ts'
import { useGetPbdsInScope, useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
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
import { shouldShowTargetCount } from '@core/utils/sr.utils.ts'
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
    const rightIcon = computed(() => getPrimaryIcon(sr))

    const { srStatusIcon, getSrAccessModeLabel } = useXoSrUtils(sr, () => scope)

    const { deleteSrs, canDeleteSrs, isDeletingSrs } = useSrDelete(() => [sr])

    const {
      connectSrs,
      disconnectSrs,
      canConnectSrs,
      canDisconnectSrs,
      isConnectingSrs,
      isDisconnectingSrs,
      connectSrsErrorMessage,
      disconnectSrsErrorMessage,
      connectionTargetCount,
      disconnectionTargetCount,
    } = useSrConnection({
      srs: () => [sr],
      scope: () => scope,
    })

    const connectLabel = computed(() =>
      shouldShowTargetCount(scope, connectionTargetCount.value)
        ? t('action:connect-n', { n: connectionTargetCount.value })
        : t('action:connect')
    )

    const disconnectLabel = computed(() =>
      shouldShowTargetCount(scope, disconnectionTargetCount.value)
        ? t('action:disconnect-n', { n: disconnectionTargetCount.value })
        : t('action:disconnect')
    )

    return {
      storageRepository: r =>
        r({
          label: sr.name_label,
          to: getSrPageLocation(sr, scope),
          icon: srStatusIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(sr.name_description),
      storageFormat: r => r(sr.SR_type),
      accessMode: r => r(getSrAccessModeLabel(sr)),
      usedSpace: r => r(sr.physical_usage, sr.size),
      actions: r =>
        r({
          onClick: () => (selectedSrId.value = sr.id),
          actions: [
            {
              label: connectLabel.value,
              icon: 'action:connect',
              onClick: () => connectSrs(),
              busy: isConnectingSrs.value,
              disabled: !canConnectSrs.value,
              hint: connectSrsErrorMessage.value,
            },
            {
              label: disconnectLabel.value,
              icon: 'action:disconnect',
              onClick: () => disconnectSrs(),
              busy: isDisconnectingSrs.value,
              disabled: !canDisconnectSrs.value,
              hint: disconnectSrsErrorMessage.value,
            },
            {
              label: t('action:delete'),
              icon: 'action:delete',
              onClick: () => deleteSrs(),
              disabled: !canDeleteSrs.value,
              busy: isDeletingSrs.value,
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
