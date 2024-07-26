<template>
  <StateHero :type class="coming-soon-hero" image="under-construction">
    {{ $t('coming-soon') }}
  </StateHero>
</template>

<script lang="ts" setup>
import StateHero, { type StateHeroType } from '@core/components/state-hero/StateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>
