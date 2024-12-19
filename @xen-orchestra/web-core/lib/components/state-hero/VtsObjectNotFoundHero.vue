<template>
  <VtsStateHero class="vts-object-not-found-hero" image="no-result" :type>
    {{ $t('object-not-found', { id }) }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  id: string
  type: StateHeroType
}>()
</script>
