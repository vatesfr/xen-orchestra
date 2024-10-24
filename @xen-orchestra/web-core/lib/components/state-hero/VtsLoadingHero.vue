<template>
  <VtsStateHero v-if="!disabled" :type busy class="vts-loading-hero">
    {{ $t('loading-in-progress') }}
  </VtsStateHero>
  <slot v-else />
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
  disabled?: boolean
}>()
</script>
