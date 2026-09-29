<template>
  <div class="storage-repositories-table">
    <UiTitle>
      {{ t('storage-repositories') }}
    </UiTitle>
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="sr of paginatedSrs" :key="sr.uuid" :selected="selectedSrId === sr.uuid">
            <BodyCells :key="getSrPbdsSignature(sr, scope)" :item="sr" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useGetPbdsInScope, useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import { useSrDelete } from '@/modules/storage-repository/composables/use-sr-delete.composable.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useSrColumns } from '@core/tables/column-sets/sr-columns.ts'
import { type SrScope } from '@core/types/storage-repository.type.ts'
import { shouldShowTargetCount } from '@core/utils/sr.utils.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  srs: rawSrs,
  pool,
  scope,
  busy,
  error,
} = defineProps<{
  srs: XenApiSr[]
  pool: XenApiPool
  scope: SrScope
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { isReady, hasError, isDefaultSr } = useSrStore().subscribe()

const selectedSrId = useRouteQuery('id')

const searchQuery = ref('')

const filteredSrs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawSrs
  }

  return rawSrs.filter(sr => Object.values(sr).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const state = useTableState({
  busy: () => busy ?? !isReady.value,
  error: () => error ?? hasError.value,
  empty: () => {
    if (rawSrs.length === 0) {
      return t('no-storage-repository-detected')
    }

    if (filteredSrs.value.length === 0) {
      return { type: 'no-result' }
    }

    return false
  },
})

const { pageRecords: paginatedSrs, paginationBindings } = usePagination('srs', filteredSrs)

const { getSrPbdsSignature } = useGetPbdsInScope()

function getPrimaryIcon(sr: XenApiSr) {
  if (!isDefaultSr(sr, pool)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('default-storage-repository'),
  }
}

const { HeadCells, BodyCells } = useSrColumns({
  body: (sr: XenApiSr) => {
    const rightIcon = computed(() => getPrimaryIcon(sr))

    const { srStatusIcon } = useSrUtils(sr, () => scope)

    const { deleteSrs, canDeleteSrs, isDeletingSrs, deleteSrsErrorMessage } = useSrDelete(() => [sr])

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
          icon: srStatusIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(sr.name_description),
      storageFormat: r => r(sr.type),
      accessMode: r => r(sr.shared ? t('shared') : t('local')),
      usedSpace: r => r(sr.physical_utilisation, sr.physical_size),
      actions: r =>
        r({
          onClick: () => (selectedSrId.value = sr.uuid),
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
              busy: isDeletingSrs.value,
              disabled: !canDeleteSrs.value,
              hint: deleteSrsErrorMessage.value,
              accent: 'danger',
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.storage-repositories-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container,
  .table-actions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
