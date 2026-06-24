<template>
  <RouterView v-slot="{ Component }">
    <UserManagementHeader />
    <component :is="Component" :users />
  </RouterView>
</template>

<script lang="ts" setup>
import UserManagementHeader from '@/administration/user-management/UserManagementHeader.vue'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/administration/user-management', 'users')

const { users } = useXoUserCollection()

// watch(users, value => {
//   console.log(value)
// })
</script>
