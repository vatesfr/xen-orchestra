<template>
  <VtsStateHero :type busy class="vts-loading-hero">
    {{ $t('loading-in-progress') }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
  disabled?: never
}>()
</script>
