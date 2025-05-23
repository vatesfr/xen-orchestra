<template>
  <span v-bind="stack.bindings" class="display-icon-stack">
    <template v-if="stack.config.borderColor">
      <DisplayIconAny
        v-for="(icon, index) of stack.icons"
        :key="index"
        :icon
        :stroke="stack.config.borderColor"
        class="border-path"
      />
    </template>
    <DisplayIconAny v-for="(icon, index) of stack.icons" :key="index" :icon />
  </span>
</template>

<script lang="ts" setup>
import type { IconStack } from './types.ts'
import DisplayIconAny from './DisplayIconAny.vue'

defineProps<{
  stack: IconStack
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

  .border-path {
    stroke-width: 64;
  }
}
</style>
