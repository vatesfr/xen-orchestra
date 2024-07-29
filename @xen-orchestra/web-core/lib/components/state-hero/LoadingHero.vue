<template>
  <StateHero v-if="!disabled" :type busy class="loading-hero">
    {{ $t('loading-in-progress') }}
  </StateHero>
  <slot v-else />
</template>

<script lang="ts" setup>
import StateHero, { type StateHeroType } from '@core/components/state-hero/StateHero.vue'

defineProps<{
  type: StateHeroType
  disabled?: boolean
}>()
</script>
