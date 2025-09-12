<template>
  <VtsStateHero v-if="!arePoolsReady" format="page" busy size="large" />
  <VtsStateHero v-else-if="!pool" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <PoolHeader :pool />
    <component :is="Component" :pool />
  </RouterView>
</template>

<script lang="ts" setup>
import PoolHeader from '@/components/pool/PoolHeader.vue'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/pool/[id]', 'dashboard')

const route = useRoute<'/pool/[id]'>()

const { t } = useI18n()

const { arePoolsReady, useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => route.params.id as XoPool['id'])
</script>
