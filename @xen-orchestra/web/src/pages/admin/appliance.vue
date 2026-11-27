<template>
  <RouterView v-slot="{ Component }">
    <ApplianceHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import ApplianceHeader from '@/modules/admin/components/ApplianceHeader.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/appliance', 'update')
</script>
