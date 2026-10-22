<template>
  <div class="new-user-roles-table">
    <UiAlert accent="info">
      {{ t('user:roles-from-groups-info') }}
    </UiAlert>
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="role of paginatedRoles" :key="role.id">
          <BodyCells :item="role" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import {
  type FilterableRole,
  useRoleQueryBuilder,
} from '@/modules/role/composables/use-role-query-builder.composable.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useRoleColumns } from '@core/tables/column-sets/role-columns.ts'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { roles, inheritedRoleIds, busy, error } = defineProps<{
  roles: FrontXoRole[]
  inheritedRoleIds: FrontXoRole['id'][]
  busy: boolean
  error: boolean
}>()

const selectedRoleIds = defineModel<FrontXoRole['id'][]>('selectedRoleIds', { required: true })

const { t } = useI18n()

const {
  items: filteredRoles,
  filter,
  schema,
} = useRoleQueryBuilder('new-user-roles', () => roles, {
  ignoreRoute: true,
})

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('new-user-roles', filteredRoles, {
  ignoreRoute: true,
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    roles.length === 0 ? t('no-role-detected') : filteredRoles.value.length === 0 ? { type: 'no-result' } : false,
})

const selectableRoles = computed(() => roles.filter(role => !inheritedRoleIds.includes(role.id)))

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: selectableRoles,
  filteredItems: filteredRoles,
  pageItems: paginatedRoles,
  getItemId: role => role.id,
})

watch(selectedIds, ids => {
  selectedRoleIds.value = selectableRoles.value.filter(role => ids.includes(role.id)).map(role => role.id)
})

const { HeadCells, BodyCells } = useRoleColumns({
  exclude: ['group', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (role: FilterableRole) => ({
    checkbox: r =>
      r({
        selected: inheritedRoleIds.includes(role.id) || isSelected(role.id),
        disabled: inheritedRoleIds.includes(role.id),
        onToggle: () => toggleSelection(role.id),
      }),
    name: r => r({ label: role.name, icon: 'fa:key' }),
    description: r => r(role.description),
    users: r => r(role.usersCount),
    groups: r => r(role.groupsCount),
    privileges: r => r(role.privilegesCount),
  }),
})
</script>

<style lang="postcss" scoped>
.new-user-roles-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
