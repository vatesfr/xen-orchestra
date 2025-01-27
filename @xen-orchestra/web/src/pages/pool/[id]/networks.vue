<template>
  <div class="networks">
    <UiCard class="container">
      <PoolNetworksTable />
      <PoolHostInternalNetworksTable />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworksTable from '@/components/pool/PoolHostInternalNetworksTable.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style scoped lang="postcss">
.networks {
  display: flex;
  .container {
    margin: 0.8rem;
    flex: 1;
  }
}
</style>
