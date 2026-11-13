<template>
  <div class="users-selection-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="user of paginatedUsers" :key="user.id">
          <BodyCells :item="user" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import {
  type FilterableUser,
  useUserQueryBuilder,
} from '@/modules/user/composables/use-user-query-builder.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { getUserDisplayName } from '@/modules/user/utils/xo-user.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useUserColumns } from '@core/tables/column-sets/user-columns.ts'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { users, busy, error } = defineProps<{
  users: FrontXoUser[]
  busy?: boolean
  error?: boolean
}>()

const selectedUserIds = defineModel<FrontXoUser['id'][]>('selectedUserIds', { required: true })

const { t } = useI18n()

const {
  items: filteredUsers,
  filter,
  schema,
} = useUserQueryBuilder('users-selection', () => users, {
  ignoreRoute: true,
})

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('users-selection', filteredUsers, {
  ignoreRoute: true,
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    users.length === 0 ? t('no-user-detected') : filteredUsers.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => users,
  filteredItems: filteredUsers,
  pageItems: paginatedUsers,
  getItemId: user => user.id,
})

watch(selectedIds, ids => {
  selectedUserIds.value = users.filter(user => ids.includes(user.id)).map(user => user.id)
})

const { HeadCells, BodyCells } = useUserColumns({
  exclude: ['actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (user: FilterableUser) => ({
    checkbox: r => r({ selected: isSelected(user.id), onToggle: () => toggleSelection(user.id) }),
    username: r => r(getUserDisplayName(user)),
    firstName: r => r(user.firstname),
    lastName: r => r(user.lastname),
    email: r => r(user.email),
    providers: r => r(user.providers),
  }),
})
</script>

<style lang="postcss" scoped>
.users-selection-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
