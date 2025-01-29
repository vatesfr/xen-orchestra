<template>
  <div class="networks">
    <UiCard class="container">
      <PoolNetworksTable :pool />
      <PoolHostInternalNetworksTable :pool />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworksTable from '@/components/pool/PoolHostInternalNetworksTable.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{
  pool: XoPool
}>()
</script>

<style scoped lang="postcss">
.networks {
  .container {
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
