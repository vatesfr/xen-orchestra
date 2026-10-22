<template>
  <div class="new-user-groups-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="group of paginatedGroups" :key="group.id">
          <BodyCells :item="group" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import {
  type FilterableGroup,
  useGroupQueryBuilder,
} from '@/modules/group/composables/use-group-query-builder.composable.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useGroupColumns } from '@core/tables/column-sets/group-columns.ts'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { groups, busy, error } = defineProps<{
  groups: FrontXoGroup[]
  busy: boolean
  error: boolean
}>()

const selectedGroupIds = defineModel<FrontXoGroup['id'][]>('selectedGroupIds', { required: true })

const { t } = useI18n()

const {
  items: filteredGroups,
  filter,
  schema,
} = useGroupQueryBuilder('new-user-groups', () => groups, {
  ignoreRoute: true,
})

const { pageRecords: paginatedGroups, paginationBindings } = usePagination('new-user-groups', filteredGroups, {
  ignoreRoute: true,
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    groups.length === 0 ? t('no-group-detected') : filteredGroups.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => groups,
  filteredItems: filteredGroups,
  pageItems: paginatedGroups,
  getItemId: group => group.id,
})

watch(selectedIds, ids => {
  selectedGroupIds.value = groups.filter(group => ids.includes(group.id)).map(group => group.id)
})

const { HeadCells, BodyCells } = useGroupColumns({
  exclude: ['selectItem', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (group: FilterableGroup) => ({
    checkbox: r => r({ selected: isSelected(group.id), onToggle: () => toggleSelection(group.id) }),
    name: r => r({ label: group.name, icon: 'table:group' }),
    provider: r => r(group.provider),
    users: r => r(group.usersCount),
    roles: r => r(group.rolesCount),
  }),
})
</script>

<style lang="postcss" scoped>
.new-user-groups-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
