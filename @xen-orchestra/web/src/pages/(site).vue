<template>
  <VtsLoadingHero v-if="!arePoolsReady" type="page" />
  <RouterView v-slot="{ Component }">
    <SiteHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import SiteHeader from '@/components/site/SiteHeader.vue'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'

const { arePoolsReady } = useXoPoolCollection()
</script>
