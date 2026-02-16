<template>
  <div class="storage-repositories-table">
    <UiTitle>
      {{ t('storage-repositories') }}
      <template #action>
        <UiLink size="medium" :href>{{ t('configure-in-xo-5') }}</UiLink>
      </template>
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
          <VtsRow v-for="sr of paginatedSrs" :key="sr.id" :selected="selectedSrId === sr.id">
            <BodyCells :item="sr" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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
  busy,
  error,
} = defineProps<{
  srs: FrontXoSr[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route('/new/sr'))

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

function getPrimaryIcon(sr: FrontXoSr) {
  if (!isDefaultSr(sr)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('default-storage-repository'),
  }
}

const { getPbdsByIds } = useXoPbdCollection()

const { HeadCells, BodyCells } = useSrColumns({
  body: (sr: FrontXoSr) => {
    const { buildXo5Route } = useXoRoutes()

    const href = computed(() => buildXo5Route(`/srs/${sr.id}/general`))
    const rightIcon = computed(() => getPrimaryIcon(sr))

    const { allPbdsConnectionStatus } = useXoPbdUtils(() => getPbdsByIds(sr.$PBDs))

    return {
      storageRepository: r =>
        r({
          label: sr.name_label,
          href: href.value,
          icon: objectIcon('sr', allPbdsConnectionStatus.value),
          rightIcon: rightIcon.value,
        }),
      description: r => r(sr.name_description),
      storageFormat: r => r(sr.SR_type),
      accessMode: r => r(sr.shared ? t('shared') : t('local')),
      usedSpace: r => r(sr.physical_usage, sr.size),
      selectItem: r => r(() => (selectedSrId.value = sr.id)),
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
