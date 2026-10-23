<template>
  <AssignmentsTableLayout
    :title="t('roles')"
    :can-add="canAddRoles"
    :is-adding="isAddingRoles"
    :can-detach="canDetachSelectedRoles"
    :is-detaching="isDetachingSelectedRoles"
    :detach-error-message="detachSelectedRolesErrorMessage"
    @add="addRoles()"
    @detach="detachSelectedRoles({ detached: true })"
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
        <VtsRow v-for="role of paginatedRoles" :key="role.id" :selected="selectedRoleId === role.id">
          <BodyCells :item="role" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </AssignmentsTableLayout>
</template>

<script lang="ts" setup>
import {
  type FilterableRole,
  useRoleQueryBuilder,
} from '@/modules/role/composables/use-role-query-builder.composable.ts'
import { useXoRoleUsersRemoveJob } from '@/modules/role/jobs/xo-role-users-remove.job.ts'
import { useUserRolesAdd } from '@/modules/user/composables/use-user-roles-add.composable.ts'
import type { UserRole } from '@/modules/user/composables/use-xo-user-roles.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import AssignmentsTableLayout from '@/shared/components/AssignmentsTableLayout.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useRoleColumns } from '@core/tables/column-sets/role-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user, roles, busy, error } = defineProps<{
  user: FrontXoUser
  roles: UserRole[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedRoleId = useRouteQuery('id')

const { addRoles, canAddRoles, isAddingRoles } = useUserRolesAdd(() => user)

const { items: filteredRoles, filter, schema } = useRoleQueryBuilder('user-roles', () => roles)

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('user-roles', filteredRoles)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    roles.length === 0 ? t('no-role-applied') : filteredRoles.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => roles.filter(role => role.isDirect),
  filteredItems: () => filteredRoles.value.filter(role => role.isDirect),
  pageItems: () => paginatedRoles.value.filter(role => role.isDirect),
  getItemId: role => role.id,
})

const selectedRoles = computed(() => roles.filter(role => selectedIds.value.includes(role.id)))

const {
  run: detachSelectedRoles,
  canRun: canDetachSelectedRoles,
  isRunning: isDetachingSelectedRoles,
  errorMessage: detachSelectedRolesErrorMessage,
} = useXoRoleUsersRemoveJob(selectedRoles, () => [user])

const { HeadCells, BodyCells } = useRoleColumns({
  exclude: ['users', 'groups'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (role: FilterableRole<UserRole>) => {
    const {
      run: detachRole,
      canRun: canDetachRole,
      isRunning: isDetachingRole,
      errorMessage: detachRoleErrorMessage,
    } = useXoRoleUsersRemoveJob(
      () => [role],
      () => [user]
    )

    return {
      checkbox: r =>
        r({ selected: isSelected(role.id), onToggle: () => toggleSelection(role.id), disabled: !role.isDirect }),
      name: r =>
        r({ label: role.name, icon: 'fa:key', to: { name: '/admin/role/[id]/general', params: { id: role.id } } }),
      group: r => r(role.inheritedFromGroups.map(group => group.name).join(', ')),
      description: r => r(role.description),
      privileges: r => r(role.privilegesCount),
      actions: r =>
        r({
          onClick: () => (selectedRoleId.value = role.id),
          actions: [
            {
              label: t('action:detach'),
              icon: 'action:detach',
              onClick: () => detachRole({ detached: true }),
              disabled: !canDetachRole.value,
              busy: isDetachingRole.value,
              hint: detachRoleErrorMessage.value,
            },
          ],
        }),
    }
  },
})
</script>
