<template>
  <ConnectPoolHeader />
  <UiCard class="pool-connect-card">
    <ConnectionForm />
  </UiCard>
</template>

<script setup lang="ts">
import ConnectionForm from '@/components/pool/connect/ConnectionForm.vue'
import ConnectPoolHeader from '@/components/pool/connect/ConnectPoolHeader.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style lang="postcss" scoped>
.pool-connect-card {
  margin: 0.8rem;
}
</style>
