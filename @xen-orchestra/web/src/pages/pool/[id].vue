<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!pool" :id="route.params.id" type="page" />
  <RouterView v-else v-slot="{ Component }">
    <PoolHeader :pool />
    <component :is="Component" :pool />
  </RouterView>
</template>

<script lang="ts" setup>
import PoolHeader from '@/components/pool/PoolHeader.vue'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/pool/[id]'>()

const { isReady, get } = usePoolStore().subscribe()

const pool = computed(() => get(route.params.id as XoPool['id']))
</script>
