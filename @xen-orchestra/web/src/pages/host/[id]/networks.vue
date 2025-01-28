<template>
  <div class="networks">
    <UiCard class="container">
      <HostPifsTable :host />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import HostPifsTable from '@/components/host/HostPifsTable.vue'
import type { XoHost } from '@/types/xo/host.type'
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{
  host: XoHost
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
