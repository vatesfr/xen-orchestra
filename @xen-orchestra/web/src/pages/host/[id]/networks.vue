<template>
  <div class="networks">
    <UiCard class="container">
      <HostPifsTable :host />
    </UiCard>
    <HostPifsSidePanel />
  </div>
</template>

<script setup lang="ts">
import HostPifsSidePanel from '@/components/host/HostPifsSidePanel.vue'
import HostPifsTable from '@/components/host/HostPifsTable.vue'
import type { XoHost } from '@/types/xo/host.type'
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{
  host: XoHost
}>()
</script>

<style scoped lang="postcss">
.networks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;
  height: 100%;
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
