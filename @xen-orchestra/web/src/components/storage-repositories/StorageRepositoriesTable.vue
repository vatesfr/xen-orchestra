<template>
  <div class="storage-repositories-table">
    <UiTitle>
      {{ t('storage-repositories') }}
      <template #actions>
        <UiLink size="medium" href="/#/backup/new">{{ t('configure-in-xo-5') }}</UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
      <VtsTableNew :busy="!isReady" :error="hasError" :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="sr of paginatedSrs" :key="sr.id" :selected="selectedSrId === sr.id">
            <BodyCells :item="sr" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { objectIcon } from '@core/icons'
import { useSrColumns } from '@core/tables/column-sets/sr-columns'
import type { XoSr } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { srs: rawSrs } = defineProps<{
  srs: XoSr[]
  hasError: boolean
  isReady: boolean
}>()

const { t } = useI18n()

const selectedSrId = useRouteQuery('id')

const { isDefaultSr } = useXoSrCollection()

const searchQuery = ref('')

const filteredSrs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawSrs
  }

  return rawSrs.filter(sr => Object.values(sr).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const { pageRecords: paginatedSrs, paginationBindings } = usePagination('srs', filteredSrs)

const { HeadCells, BodyCells } = useSrColumns({
  body: (sr: XoSr) => ({
    storageRepository: r =>
      r({
        label: sr.name_label,
        href: `/#/srs/${sr.id}/general`,
        icon: objectIcon('sr', 'muted'),
        rightIcon: isDefaultSr(sr) ? { icon: 'legacy:primary', tooltip: t('default-storage-repository') } : undefined,
      }),
    description: r => r(sr.name_description),
    storageFormat: r => r(sr.SR_type),
    accessMode: r => r(sr.shared ? t('shared') : t('local')),
    usedSpace: r => r(sr.physical_usage, sr.size),
    selectId: r => r(() => (selectedSrId.value = sr.id)),
  }),
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

  .checkbox,
  .more {
    width: 4.8rem;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }

  .name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
