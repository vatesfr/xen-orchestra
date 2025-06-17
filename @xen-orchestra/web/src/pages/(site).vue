<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <RouterView v-slot="{ Component }">
    <SiteHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import SiteHeader from '@/components/site/SiteHeader.vue'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'

const { isReady } = usePoolStore().subscribe()
</script>
