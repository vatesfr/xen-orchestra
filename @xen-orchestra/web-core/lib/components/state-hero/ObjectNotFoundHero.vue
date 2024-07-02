<template>
  <StateHero image="no-result" class="object-not-found-hero">
    {{ $t('object-not-found', { id }) }}
  </StateHero>
</template>

<script lang="ts" setup>
import StateHero from '@core/components/state-hero/StateHero.vue'

defineProps<{
  id: string
}>()
</script>
