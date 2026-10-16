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
import { useGroupRolesAdd } from '@/modules/group/composables/use-group-roles-add.composable.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import {
  type FilterableRole,
  useRoleQueryBuilder,
} from '@/modules/role/composables/use-role-query-builder.composable.ts'
import { useXoRoleGroupsRemoveJob } from '@/modules/role/jobs/xo-role-groups-remove.job.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
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

const { group, roles, busy, error } = defineProps<{
  group: FrontXoGroup
  roles: FrontXoRole[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedRoleId = useRouteQuery('id')

const { addRoles, canAddRoles, isAddingRoles } = useGroupRolesAdd(() => group)

const { items: filteredRoles, filter, schema } = useRoleQueryBuilder('group-roles', () => roles)

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('group-roles', filteredRoles)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    roles.length === 0 ? t('no-role-applied') : filteredRoles.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => roles,
  filteredItems: filteredRoles,
  pageItems: paginatedRoles,
  getItemId: role => role.id,
})

const selectedRoles = computed(() => roles.filter(role => selectedIds.value.includes(role.id)))

const {
  run: detachSelectedRoles,
  canRun: canDetachSelectedRoles,
  isRunning: isDetachingSelectedRoles,
  errorMessage: detachSelectedRolesErrorMessage,
} = useXoRoleGroupsRemoveJob(selectedRoles, () => [group])

const { HeadCells, BodyCells } = useRoleColumns({
  exclude: ['group', 'users', 'groups'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (role: FilterableRole) => {
    const {
      run: detachRole,
      canRun: canDetachRole,
      isRunning: isDetachingRole,
      errorMessage: detachRoleErrorMessage,
    } = useXoRoleGroupsRemoveJob(
      () => [role],
      () => [group]
    )

    return {
      checkbox: r => r({ selected: isSelected(role.id), onToggle: () => toggleSelection(role.id) }),
      name: r =>
        r({ label: role.name, icon: 'fa:key', to: { name: '/admin/role/[id]/general', params: { id: role.id } } }),
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
