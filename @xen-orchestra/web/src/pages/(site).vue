<template>
  <VtsStateHero v-if="!arePoolsReady" format="page" busy />
  <RouterView v-slot="{ Component }">
    <SiteHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import SiteHeader from '@/components/site/SiteHeader.vue'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/(site)', 'dashboard')

const { arePoolsReady } = useXoPoolCollection()
</script>
