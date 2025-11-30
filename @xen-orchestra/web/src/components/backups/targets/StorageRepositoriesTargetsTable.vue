<template>
  <div class="storage-repositories-targets-table">
    <UiTitle>
      {{ t('storage-repositories') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTable :busy="!isReady" :error="hasError" :empty="emptyMessage" :pagination-bindings>
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
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { defineColumns } from '@core/packages/table/define-columns'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column'
import { formatSizeRaw } from '@core/utils/size.util'
import type { XoSr } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositories } = defineProps<{
  storageRepositories: XoSr[]
  isReady: boolean
  hasError: boolean
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

const emptyMessage = computed(() => {
  if (storageRepositories.length === 0) {
    return t('no-storage-repositories-detected')
  }

  if (filteredSrs.value.length === 0) {
    return t('no-result')
  }

  return undefined
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
