<template>
  <div class="users-user-management-table">
    <UiTitle>
      {{ t('users') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
      </div>

      <VtsTable :state :pagination-bindings sticky="right">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.js'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useUserColumns } from '@xen-orchestra/web-core/tables/column-sets/user-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
}>()

defineSlots<{
  'title-actions'?(): any
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredUsers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return users
  }

  return users.filter(user => Object.values(user).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const selectedUserId = useRouteQuery('id')

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('users', filteredUsers)

const state = useTableState({
  empty: () =>
    users.length === 0 ? t('no-user-detected') : filteredUsers.value.length === 0 ? { type: 'no-result' } : false,
})

const { HeadCells, BodyCells } = useUserColumns({
  body: (user: FrontXoUser) => {
    return {
      username: r => r(user.name ?? ''),
      email: r => r(user.email),
      providers: r => {
        const providers = Object.keys(user.authProviders ?? {})
        return r(providers.length === 0 ? t('local') : providers.join(', '))
      },
      selectItem: r => r(() => (selectedUserId.value = user.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.users-user-management-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.users-user-management-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
