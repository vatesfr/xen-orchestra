<template>
  <div class="groups-table">
    <UiTitle>
      {{ t('groups') }}
    </UiTitle>
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="group of paginatedGroups" :key="group.id" :selected="selectedGroupId === group.id">
            <BodyCells :item="group" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  type FilterableGroup,
  useGroupQueryBuilder,
} from '@/modules/group/composables/use-group-query-builder.composable.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useGroupColumns } from '@core/tables/column-sets/group-columns.ts'
import { useI18n } from 'vue-i18n'

const {
  groups: rawGroups,
  busy,
  error,
} = defineProps<{
  groups: FrontXoGroup[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedGroupId = useRouteQuery('id')

const { items: filteredGroups, filter, schema } = useGroupQueryBuilder('groups', () => rawGroups)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawGroups.length === 0 ? t('no-group-detected') : filteredGroups.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedGroups, paginationBindings } = usePagination('groups', filteredGroups)

const { HeadCells, BodyCells } = useGroupColumns({
  exclude: ['checkbox', 'actions'],
  body: (group: FilterableGroup) => ({
    name: r => r(group.name),
    provider: r => r(group.provider),
    users: r => r(group.usersCount),
    roles: r => r(group.rolesCount),
    selectItem: r => r(() => (selectedGroupId.value = group.id)),
  }),
})
</script>

<style scoped lang="postcss">
.groups-table,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
