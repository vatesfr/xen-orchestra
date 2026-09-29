<template>
  <svg aria-hidden="true" viewBox="0 0 400 400">
    <use :href />
  </svg>
</template>

<script lang="ts" setup>
import type { StateHeroType } from '@core/types/state-hero.type.ts'
import { computed } from 'vue'

const { type } = defineProps<{
  type: Exclude<StateHeroType, 'busy'>
}>()

const href = computed(() => `${new URL(`../../assets/${type}.svg`, import.meta.url).href}#${type}`)
</script>
