<template>
  <VtsStateHero v-if="!arePoolsReady" format="page" type="busy" size="large" />
  <RouterView v-slot="{ Component }">
    <SiteHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import SiteHeader from '@/modules/site/components/SiteHeader.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/(site)', 'dashboard')

const { arePoolsReady } = useXoPoolCollection()
</script>
