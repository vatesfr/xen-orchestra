<template>
  <div class="networks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <PoolNetworksTable :networks />
      <PoolHostInternalNetworksTable :networks="internalNetworks" />
    </UiCard>
    <PoolNetworkSidePanel v-if="selectedNetwork" :network="selectedNetwork" @close="selectedNetwork = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworksTable from '@/components/pool/PoolHostInternalNetworksTable.vue'
import PoolNetworkSidePanel from '@/components/pool/PoolNetworkSidePanel.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPool } from '@/types/xo/pool.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { networksWithoutPifs, networksWithPifs, get } = useNetworkStore().subscribe()
const uiStore = useUiStore()

const internalNetworks = computed(() => networksWithoutPifs.value.filter(network => network.$pool === pool.id))

const networks = computed(() => networksWithPifs.value.filter(network => network.$pool === pool.id))

const selectedNetwork = useRouteQuery<XoNetwork | undefined>('id', {
  toData: id => get(id as XoNetwork['id']),
  toQuery: network => network?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }
}

.container {
  height: fit-content;
  margin: 0.8rem;
  gap: 4rem;
}
</style>
