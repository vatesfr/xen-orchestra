<template>
  <div class="networks">
    <UiCard class="container">
      <PoolNetworksTable :pool />
      <PoolHostInternalNetworksTable :pool />
    </UiCard>
    <PoolNetworksSidePanel v-if="network" :network />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworksTable from '@/components/pool/PoolHostInternalNetworksTable.vue'
import PoolNetworksSidePanel from '@/components/pool/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPool } from '@/types/xo/pool.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

defineProps<{
  pool: XoPool
}>()

const { get } = useNetworkStore().subscribe()

const network = useRouteQuery<XoNetwork | undefined>('id', {
  toData: id => get(id as XoNetwork['id']),
  toQuery: network => network?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
