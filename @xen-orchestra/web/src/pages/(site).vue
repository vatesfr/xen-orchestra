<template>
  <VtsLoadingHero v-if="!isPoolCollectionReady" type="page" />
  <RouterView v-slot="{ Component }">
    <SiteHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import SiteHeader from '@/components/site/SiteHeader.vue'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/(site)', 'dashboard')

const { isPoolCollectionReady } = useXoPoolCollection()
</script>
