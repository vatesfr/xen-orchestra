<template>
  <UiCard class="pool-dashboard-patch">
    <UiCardTitle>{{ $t('patches') }}</UiCardTitle>
    <VtsComingSoonHero type="card" />
  </UiCard>
</template>

<script setup lang="ts">
import VtsComingSoonHero from '@core/components/state-hero/VtsComingSoonHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
</script>

<style lang="postcss" scoped>
.pool-dashboard-patch {
  height: 100%;
}
</style>
