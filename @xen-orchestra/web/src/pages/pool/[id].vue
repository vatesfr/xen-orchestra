<template>
  <LoadingHero v-if="!isReady" type="page" />
  <ObjectNotFoundHero v-else-if="!pool" :id="route.params.id" />
  <RouterView v-else v-slot="{ Component }">
    <PoolHeader :pool />
    <component :is="Component" :pool />
  </RouterView>
</template>

<script setup lang="ts">
import PoolHeader from '@/components/pool/PoolHeader.vue'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { RecordId } from '@/types/xo-object.type'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import ObjectNotFoundHero from '@core/components/state-hero/ObjectNotFoundHero.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/pool/[id]'>()

const { isReady, get } = usePoolStore().subscribe()

const pool = computed(() => get(route.params.id as RecordId<'pool'>))
</script>
