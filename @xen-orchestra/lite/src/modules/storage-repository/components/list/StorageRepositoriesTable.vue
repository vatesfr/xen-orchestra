<template>
  <div class="storage-repositories-table">
    <UiTitle>
      {{ t('storage-repositories') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="sr of paginatedSrs" :key="sr.uuid" :selected="selectedSrId === sr.uuid">
            <BodyCells :item="sr" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { usePbdUtils } from '@/modules/storage-repository/composables/pbd-utils.composable.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon, objectIcon } from '@core/icons'
import { useSrColumns } from '@core/tables/column-sets/sr-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  srs: rawSrs,
  pool,
  busy,
  error,
} = defineProps<{
  srs: XenApiSr[]
  pool: XenApiPool
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { isReady, hasError, isDefaultSr } = useSrStore().subscribe()
const { getPbdsForSr } = usePbdStore().subscribe()

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

    const { allPbdsConnectionStatus } = usePbdUtils(() => getPbdsForSr(sr.$ref))

    return {
      storageRepository: r =>
        r({
          label: sr.name_label,
          icon: objectIcon('sr', allPbdsConnectionStatus.value),
          rightIcon: rightIcon.value,
        }),
      description: r => r(sr.name_description),
      storageFormat: r => r(sr.type),
      accessMode: r => r(sr.shared ? t('shared') : t('local')),
      usedSpace: r => r(sr.physical_utilisation, sr.physical_size),
      actions: r => r({ onClick: () => (selectedSrId.value = sr.uuid) }),
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
