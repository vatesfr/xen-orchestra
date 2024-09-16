<template>
  <StateHero class="no-data-hero" image="no-data" :type>{{ $t('no-data') }}</StateHero>
</template>

<script lang="ts" setup>
import StateHero, { type StateHeroType } from '@core/components/state-hero/StateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>
