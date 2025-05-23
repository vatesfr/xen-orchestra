<template>
  <VtsStateHero :type class="vts-all-good-hero" image="all-good">
    {{ $t('all-good') }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>
