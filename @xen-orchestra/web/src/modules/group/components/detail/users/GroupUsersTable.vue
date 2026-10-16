<template>
  <AssignmentsTableLayout
    :title="t('users')"
    :can-add="canAddUsers"
    :is-adding="isAddingUsers"
    :can-detach="canDetachSelectedUsers"
    :is-detaching="isDetachingSelectedUsers"
    :detach-error-message="detachSelectedUsersErrorMessage"
    @add="addUsers()"
    @detach="detachSelectedUsers({ detached: true })"
  >
    <template #filter>
      <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    </template>
    <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="user of paginatedUsers" :key="user.id" :selected="selectedUserId === user.id">
          <BodyCells :item="user" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </AssignmentsTableLayout>
</template>

<script lang="ts" setup>
import { useGroupUsersAdd } from '@/modules/group/composables/use-group-users-add.composable.ts'
import { useXoGroupUsersRemoveJob } from '@/modules/group/jobs/xo-group-users-remove.job.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import {
  type FilterableUser,
  useUserQueryBuilder,
} from '@/modules/user/composables/use-user-query-builder.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import AssignmentsTableLayout from '@/shared/components/AssignmentsTableLayout.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useUserColumns } from '@core/tables/column-sets/user-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { group, users, busy, error } = defineProps<{
  group: FrontXoGroup
  users: FrontXoUser[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedUserId = useRouteQuery('id')

const { addUsers, canAddUsers, isAddingUsers } = useGroupUsersAdd(() => group)

const { items: filteredUsers, filter, schema } = useUserQueryBuilder('group-users', () => users)

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('group-users', filteredUsers)

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

const selectedUsers = computed(() => users.filter(user => selectedIds.value.includes(user.id)))

const {
  run: detachSelectedUsers,
  canRun: canDetachSelectedUsers,
  isRunning: isDetachingSelectedUsers,
  errorMessage: detachSelectedUsersErrorMessage,
} = useXoGroupUsersRemoveJob(() => [group], selectedUsers)

const { HeadCells, BodyCells } = useUserColumns({
  exclude: ['providers'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (user: FilterableUser) => {
    const {
      run: detachUser,
      canRun: canDetachUser,
      isRunning: isDetachingUser,
      errorMessage: detachUserErrorMessage,
    } = useXoGroupUsersRemoveJob(
      () => [group],
      () => [user]
    )

    return {
      checkbox: r => r({ selected: isSelected(user.id), onToggle: () => toggleSelection(user.id) }),
      username: r => r(user.name, { to: { name: '/admin/user/[id]/general', params: { id: user.id } } }),
      firstName: r => r(user.firstname),
      lastName: r => r(user.lastname),
      email: r => r(user.email),
      actions: r =>
        r({
          onClick: () => (selectedUserId.value = user.id),
          actions: [
            {
              label: t('action:detach'),
              icon: 'action:detach',
              onClick: () => detachUser({ detached: true }),
              disabled: !canDetachUser.value,
              busy: isDetachingUser.value,
              hint: detachUserErrorMessage.value,
            },
          ],
        }),
    }
  },
})
</script>
