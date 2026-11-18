<template>
  <RouterView v-slot="{ Component }">
    <SettingsHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import SettingsHeader from '@/modules/account/components/SettingsHeader.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/settings', 'account')
</script>
