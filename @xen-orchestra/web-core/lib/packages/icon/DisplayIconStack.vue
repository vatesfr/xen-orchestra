<template>
  <span v-bind="stack.bindings" class="display-icon-stack">
    <DisplayIconAny
      v-for="(icon, index) of stack.icons"
      :key="index"
      :icon
      :stroke="stroke ?? stack.config.borderColor"
    />
    <DisplayIconAny v-for="(icon, index) of stack.icons" :key="index" :icon />
  </span>
</template>

<script lang="ts" setup>
import DisplayIconAny from '@core/packages/icon/DisplayIconAny.vue'
import type { IconStack } from './types.ts'

defineProps<{
  stack: IconStack
  stroke?: string
}>()
</script>

<style lang="postcss" scoped>
.display-icon-stack {
  height: 1em;
  width: 1em;
  overflow: visible;
  grid-row: 1;
  grid-column: 1;
  display: inline-grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
}
</style>
