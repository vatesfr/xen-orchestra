<template>
  <div class="networks">
    <UiCard class="card">
      <PoolNetworksTable :pool />
      <PoolHostInternalNetworkTable :pool />
    </UiCard>
    <PoolNetworksSidePanel />
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworkTable from '@/components/pool/PoolHostInternalNetworkTable.vue'
import PoolNetworksSidePanel from '@/components/pool/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{
  pool: XoPool
}>()
</script>

<style scoped lang="postcss">
.networks {
  display: flex;

  .card {
    margin: 0.8rem;
  }
}
</style>
