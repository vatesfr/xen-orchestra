<template>
  <div class="roles-table">
    <UiTitle>
      {{ t('roles') }}
      <template #action>
        <slot name="title-action" />
      </template>
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
          <VtsRow v-for="role of paginatedRoles" :key="role.id" :selected="selectedRoleId === role.id">
            <BodyCells :item="role" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useRoleDelete } from '@/modules/role/composables/use-role-delete.composable.ts'
import {
  type FilterableRole,
  useRoleQueryBuilder,
} from '@/modules/role/composables/use-role-query-builder.composable.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useRoleColumns } from '@core/tables/column-sets/role-columns.ts'
import { logicAnd, logicNot, logicOr } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const {
  roles: rawRoles,
  busy,
  error,
} = defineProps<{
  roles: FrontXoRole[]
  busy?: boolean
  error?: boolean
}>()

defineSlots<{
  'title-action'(): any
}>()

const { t } = useI18n()

const selectedRoleId = useRouteQuery('id')

const { areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const isReady = logicAnd(() => !busy, areGroupsReady)

const hasError = logicOr(() => error, hasGroupFetchError)

const { items: filteredRoles, filter, schema } = useRoleQueryBuilder('roles', () => rawRoles)

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    rawRoles.length === 0 ? t('no-role-detected') : filteredRoles.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('roles', filteredRoles)

const { HeadCells, BodyCells } = useRoleColumns({
  exclude: ['checkbox', 'group'],
  body: (role: FilterableRole) => {
    const { deleteRoles, canDeleteRoles, isDeletingRoles, deleteRolesErrorMessage } = useRoleDelete(() => [role])

    return {
      name: r =>
        r({ label: role.name, icon: 'fa:key', to: { name: '/admin/role/[id]/general', params: { id: role.id } } }),
      description: r => r(role.description),
      users: r => r(role.usersCount),
      groups: r => r(role.groupsCount),
      privileges: r => r(role.privilegesCount),
      actions: r =>
        r({
          onClick: () => (selectedRoleId.value = role.id),
          actions: [
            {
              label: t('action:delete'),
              icon: 'action:delete',
              onClick: () => deleteRoles(),
              disabled: !canDeleteRoles.value,
              busy: isDeletingRoles.value,
              hint: deleteRolesErrorMessage.value,
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.roles-table,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
