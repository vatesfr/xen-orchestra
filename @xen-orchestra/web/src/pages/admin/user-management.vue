<template>
  <RouterView v-slot="{ Component }">
    <UserManagementHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import UserManagementHeader from '@/modules/admin/components/UserManagementHeader.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/user-management', 'users')
</script>
