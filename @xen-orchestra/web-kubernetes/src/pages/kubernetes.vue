<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/kubernetes', 'clusters')
</script>
