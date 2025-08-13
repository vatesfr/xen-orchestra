<template>
  <VtsLoadingHero v-if="!arePoolsReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!pool" :id="route.params.id" type="page" />
  <RouterView v-else v-slot="{ Component }">
    <PoolHeader :pool />
    <component :is="Component" :pool />
  </RouterView>
</template>

<script lang="ts" setup>
import PoolHeader from '@/components/pool/PoolHeader.vue'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useRoute } from 'vue-router'

useDefaultTab('/pool/[id]', 'dashboard')

const route = useRoute<'/pool/[id]'>()

const { arePoolsReady, useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => route.params.id as XoPool['id'])
</script>
