<template>
  <div class="groups-table">
    <UiTitle>
      {{ t('groups') }}
    </UiTitle>
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <div class="container">
      <VtsTableBulkActions :actions="bulkActions" />
      <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
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
import { useGroupDelete } from '@/modules/group/composables/use-group-delete.composable.ts'
import {
  type FilterableGroup,
  useGroupQueryBuilder,
} from '@/modules/group/composables/use-group-query-builder.composable.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useGroupColumns } from '@core/tables/column-sets/group-columns.ts'
import { computed } from 'vue'
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

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => rawGroups,
  filteredItems: filteredGroups,
  pageItems: paginatedGroups,
  getItemId: group => group.id,
})

const selectedGroups = computed(() => rawGroups.filter(group => selectedIds.value.includes(group.id)))

const {
  deleteGroups: deleteSelectedGroups,
  canDeleteGroups: canDeleteSelectedGroups,
  isDeletingGroups: isDeletingSelectedGroups,
  deleteGroupsErrorMessage: deleteSelectedGroupsErrorMessage,
} = useGroupDelete(selectedGroups)

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:delete'),
    icon: 'action:delete',
    accent: 'danger',
    onClick: () => deleteSelectedGroups(),
    disabled: !canDeleteSelectedGroups.value,
    busy: isDeletingSelectedGroups.value,
    hint: deleteSelectedGroupsErrorMessage.value,
  },
])

const { HeadCells, BodyCells } = useGroupColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (group: FilterableGroup) => {
    const { deleteGroups, canDeleteGroups, isDeletingGroups, deleteGroupsErrorMessage } = useGroupDelete(() => [group])

    return {
      checkbox: r => r({ selected: isSelected(group.id), onToggle: () => toggleSelection(group.id) }),
      name: r =>
        r({
          label: group.name,
          icon: 'table:group',
          to: { name: '/admin/group/[id]/general', params: { id: group.id } },
        }),
      provider: r => r(group.provider ?? ''),
      users: r => r(group.usersCount),
      roles: r => r(group.rolesCount),
      actions: r =>
        r({
          onClick: () => (selectedGroupId.value = group.id),
          actions: [
            {
              label: t('action:delete'),
              icon: 'action:delete',
              accent: 'danger',
              onClick: () => deleteGroups(),
              disabled: !canDeleteGroups.value,
              busy: isDeletingGroups.value,
              hint: deleteGroupsErrorMessage.value,
            },
          ],
        }),
    }
  },
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
