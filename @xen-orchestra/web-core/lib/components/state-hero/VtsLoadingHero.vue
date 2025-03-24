<template>
  <VtsStateHero :type busy>
    {{ $t('loading-in-progress') }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>
