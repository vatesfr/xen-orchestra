<template>
  <div class="networks">
    <UiCard class="container">
      <PoolNetworksTable :pool />
      <PoolHostInternalNetworksTable :pool />
    </UiCard>
    <PoolNetworksSidePanel :network />
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworksTable from '@/components/pool/PoolHostInternalNetworksTable.vue'
import PoolNetworksSidePanel from '@/components/pool/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'

defineProps<{
  pool: XoPool
}>()

const { records: networks } = useNetworkStore().subscribe()

const networkId = useRouteQuery('id')

const network = computed(() => networks.value.find(network => network.id === networkId.value))
</script>

<style scoped lang="postcss">
.networks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;
  .container {
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
