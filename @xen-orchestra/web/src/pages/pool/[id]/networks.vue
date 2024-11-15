<template>
  <div class="networks">
    <UiCard class="card">
      <PoolNetworksTable />
      <PoolHostInternalNetworksTable />
    </UiCard>
    <PoolNetworksSidePanel />
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworksTable from '@/components/pool/PoolHostInternalNetworksTable.vue'
import PoolNetworksSidePanel from '@/components/pool/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style scoped lang="postcss">
.networks {
  display: flex;
  .card {
    margin: 0.8rem;
    flex: 1;
  }
}
</style>
