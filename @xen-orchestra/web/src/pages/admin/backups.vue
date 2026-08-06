<template>
  <RouterView v-slot="{ Component }">
    <BackupsHeader />
    <component :is="Component" :users />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupsHeader from '@/modules/admin/components/BackupsHeader.vue'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/backups', 'brs')

const { users } = useXoUserCollection()
</script>
