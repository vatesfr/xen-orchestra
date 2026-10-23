<template>
  <AssignmentsTableLayout
    :title="t('groups')"
    :can-add="canAddGroups"
    :is-adding="isAddingGroups"
    :can-detach="canDetachSelectedGroups"
    :is-detaching="isDetachingSelectedGroups"
    :detach-error-message="detachSelectedGroupsErrorMessage"
    @add="addGroups()"
    @detach="detachSelectedGroups({ detached: true })"
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
        <VtsRow v-for="group of paginatedGroups" :key="group.id" :selected="selectedGroupId === group.id">
          <BodyCells :item="group" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </AssignmentsTableLayout>
</template>

<script lang="ts" setup>
import {
  type FilterableGroup,
  useGroupQueryBuilder,
} from '@/modules/group/composables/use-group-query-builder.composable.ts'
import { useXoGroupUsersRemoveJob } from '@/modules/group/jobs/xo-group-users-remove.job.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useUserGroupsAdd } from '@/modules/user/composables/use-user-groups-add.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import AssignmentsTableLayout from '@/shared/components/AssignmentsTableLayout.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useGroupColumns } from '@core/tables/column-sets/group-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user, groups, busy, error } = defineProps<{
  user: FrontXoUser
  groups: FrontXoGroup[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedGroupId = useRouteQuery('id')

const { addGroups, canAddGroups, isAddingGroups } = useUserGroupsAdd(() => user)

const { items: filteredGroups, filter, schema } = useGroupQueryBuilder('user-groups', () => groups)

const { pageRecords: paginatedGroups, paginationBindings } = usePagination('user-groups', filteredGroups)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    groups.length === 0 ? t('no-group-attached') : filteredGroups.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => groups,
  filteredItems: filteredGroups,
  pageItems: paginatedGroups,
  getItemId: group => group.id,
})

const selectedGroups = computed(() => groups.filter(group => selectedIds.value.includes(group.id)))

const {
  run: detachSelectedGroups,
  canRun: canDetachSelectedGroups,
  isRunning: isDetachingSelectedGroups,
  errorMessage: detachSelectedGroupsErrorMessage,
} = useXoGroupUsersRemoveJob(selectedGroups, () => [user])

const { HeadCells, BodyCells } = useGroupColumns({
  exclude: ['selectItem'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (group: FilterableGroup) => {
    const {
      run: detachGroup,
      canRun: canDetachGroup,
      isRunning: isDetachingGroup,
      errorMessage: detachGroupErrorMessage,
    } = useXoGroupUsersRemoveJob(
      () => [group],
      () => [user]
    )

    return {
      checkbox: r => r({ selected: isSelected(group.id), onToggle: () => toggleSelection(group.id) }),
      name: r =>
        r({
          label: group.name,
          icon: 'table:group',
          to: { name: '/admin/group/[id]/general', params: { id: group.id } },
        }),
      provider: r => r(group.provider),
      users: r => r(group.usersCount),
      roles: r => r(group.rolesCount),
      actions: r =>
        r({
          onClick: () => (selectedGroupId.value = group.id),
          actions: [
            {
              label: t('action:detach'),
              icon: 'action:detach',
              onClick: () => detachGroup({ detached: true }),
              disabled: !canDetachGroup.value,
              busy: isDetachingGroup.value,
              hint: detachGroupErrorMessage.value,
            },
          ],
        }),
    }
  },
})
</script>
