<template>
  <div class="networks">
    <UiCard class="container">
      <HostPifsTable />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import HostPifsTable from '@/components/host/HostPifsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style scoped lang="postcss">
.networks {
  display: flex;
  height: 100%;

  .container {
    flex: 1;
    margin: 0.8rem;
  }
}
</style>
