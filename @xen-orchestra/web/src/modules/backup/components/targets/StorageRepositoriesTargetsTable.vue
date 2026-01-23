<template>
  <div class="storage-repositories-targets-table">
    <UiTitle>
      {{ t('storage-repositories') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTable :state :pagination-bindings>
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="sr of paginatedSrs" :key="sr.id">
            <BodyCells :item="sr" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoSr } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositories, busy, error } = defineProps<{
  storageRepositories: XoSr[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredSrs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return storageRepositories
  }

  return storageRepositories.filter(storageRepository =>
    Object.values(storageRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    storageRepositories.length === 0
      ? t('no-storage-repository-detected')
      : filteredSrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedSrs, paginationBindings } = usePagination('storage-repositories-targets', filteredSrs)

const useColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    storageRepository: useLinkColumn({ headerLabel: () => t('storage-repository') }),
    usedSpace: useNumberColumn({ headerLabel: () => t('used-space') }),
    remainingSpace: useNumberColumn({ headerLabel: () => t('remaining-space') }),
    totalCapacity: useNumberColumn({ headerLabel: () => t('total-capacity') }),
  }
})

const { HeadCells, BodyCells } = useColumns({
  body: (sr: XoSr) => {
    const { buildXo5Route } = useXoRoutes()

    const href = computed(() => buildXo5Route(`/srs/${sr.id}/general`))
    const usedSpace = computed(() => formatSizeRaw(sr.physical_usage, 2))
    const remainingSpace = computed(() => formatSizeRaw(sr.size - sr.physical_usage, 2))
    const totalCapacity = computed(() => formatSizeRaw(sr.size, 2))

    return {
      storageRepository: r => r({ label: sr.name_label, href: href.value, icon: 'fa:database' }),
      usedSpace: r => r(usedSpace.value.value, usedSpace.value.prefix),
      remainingSpace: r => r(remainingSpace.value.value, remainingSpace.value.prefix),
      totalCapacity: r => r(totalCapacity.value.value, totalCapacity.value.prefix),
    }
  },
})
</script>

<style lang="postcss" scoped>
.storage-repositories-targets-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.storage-repositories-targets-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
