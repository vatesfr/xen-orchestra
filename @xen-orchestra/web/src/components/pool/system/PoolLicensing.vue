<template>
  <UiCard class="pool-licensing">
    <UiTitle>
      {{ $t('licensing') }}
    </UiTitle>
    <VtsStateHero type="card" image="under-construction" />
  </UiCard>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
</script>
