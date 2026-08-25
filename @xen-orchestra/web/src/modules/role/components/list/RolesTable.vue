<template>
  <div class="roles-table">
    <UiTitle>
      {{ t('roles') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings>
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
  </div>
</template>

<script setup lang="ts">
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useRoleColumns } from '@core/tables/column-sets/role-columns.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type FilterableRole = FrontXoRole & {
  description: string
  usersCount: number
  groupsCount: number
  privilegesCount: number
}

const {
  roles: rawRoles,
  busy,
  error,
} = defineProps<{
  roles: FrontXoRole[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const filterableRoles = computed<FilterableRole[]>(() =>
  rawRoles.map(role => ({
    ...role,
    description: role.description ?? '',
    usersCount: role.userIds.length,
    groupsCount: role.groupIds.length,
    privilegesCount: role.privilegeIds.length,
  }))
)

const { items: filteredRoles, filter } = useQueryBuilderFilter('roles', () => filterableRoles.value)

const schema = useQueryBuilderSchema<FilterableRole>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  description: useStringSchema(t('description')),
  usersCount: useNumberSchema(t('users')),
  groupsCount: useNumberSchema(t('groups')),
  privilegesCount: useNumberSchema(t('privileges')),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawRoles.length === 0 ? t('no-role-detected') : filteredRoles.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('roles', filteredRoles)

const { HeadCells, BodyCells } = useRoleColumns({
  body: (role: FilterableRole) => ({
    name: r => r(role.name),
    description: r => r(role.description),
    users: r => r(role.usersCount),
    groups: r => r(role.groupsCount),
    privileges: r => r(role.privilegesCount),
  }),
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
