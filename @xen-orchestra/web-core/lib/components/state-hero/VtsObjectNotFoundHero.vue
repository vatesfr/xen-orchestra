<template>
  <VtsStateHero class="vts-object-not-found-hero" image="no-result" type="page">
    {{ $t('object-not-found', { id }) }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  id: string
}>()
</script>
