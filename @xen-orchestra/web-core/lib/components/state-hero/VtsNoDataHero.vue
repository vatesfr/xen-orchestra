<template>
  <VtsStateHero class="vts-no-data-hero" image="no-data" :type>{{ $t('no-data') }}</VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>
