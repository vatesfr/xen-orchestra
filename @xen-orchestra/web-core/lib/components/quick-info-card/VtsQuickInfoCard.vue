<template>
  <UiCard class="vts-quick-info-card">
    <UiCardTitle>{{ $t('quick-info') }}</UiCardTitle>
    <VtsLoadingHero :disabled="!loading" type="card">
      <div class="info-container">
        <slot />
      </div>
    </VtsLoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'

defineProps<{
  loading: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-quick-info-card {
  .info-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
    gap: 2.4rem;
  }
}
</style>
