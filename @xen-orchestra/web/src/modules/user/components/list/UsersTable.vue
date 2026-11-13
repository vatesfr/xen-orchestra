<template>
  <UiTitle>
    {{ t('users') }}
    <template #action>
      <slot name="title-actions" />
    </template>
  </UiTitle>
  <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />

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
</template>

<script setup lang="ts">
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useUserColumns } from '@xen-orchestra/web-core/tables/column-sets/user-columns.ts'
import { compareStrings } from '@xen-orchestra/web-core/utils/compare-strings.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const searchQuery = ref('')

const filteredUsers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return users
  }

  return users.filter(user => Object.values(user).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const selectedUserId = useRouteQuery('id')

const xo5UsersHref = computed(() => buildXo5Route('/settings/users'))

const state = useTableState({
  empty: () =>
    users.length === 0 ? t('no-user-detected') : filteredUsers.value.length === 0 ? { type: 'no-result' } : false,
})

const getProviders = (user: FrontXoUser) => {
  const providers = Object.keys(user.authProviders ?? {})

  return providers.length === 0 ? t('local') : providers.join(', ')
}

const { HeadCells, BodyCells, sortItems } = useUserColumns({
  body: (user: FrontXoUser) => {
    return {
      username: r => r(user.name ?? '', { href: xo5UsersHref.value }),
      email: r => r(user.email),
      providers: r => r(getProviders(user)),
      selectItem: r => r(() => (selectedUserId.value = user.id)),
    }
  },
  sort: {
    username: (user1, user2) => compareStrings(user1.name ?? '', user2.name ?? ''),
    email: (user1, user2) => compareStrings(user1.email, user2.email),
    providers: (user1, user2) => compareStrings(getProviders(user1), getProviders(user2)),
  },
})

const sortedUsers = computed(() => sortItems(filteredUsers.value))

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('users', sortedUsers)
</script>
