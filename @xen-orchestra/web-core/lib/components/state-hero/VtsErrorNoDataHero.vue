<template>
  <VtsStateHero class="vts-error-hero" image="error" :type>{{ $t('error-no-data') }}</VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>
