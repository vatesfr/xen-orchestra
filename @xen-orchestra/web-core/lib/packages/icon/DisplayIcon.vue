<template>
  <span class="display-icon-root">
    <DisplayIconAny :icon :color />
  </span>
</template>

<script lang="ts" setup>
import DisplayIconAny from './DisplayIconAny.vue'
import { type Icon } from './types.ts'

defineProps<{
  icon: Icon
  color?: string
}>()
</script>

<style lang="postcss" scoped>
.display-icon-root {
  display: inline-grid;
  height: 1em;
  width: 1em;
  transform-origin: 50% 50%;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  vertical-align: -0.125em;
}
</style>
