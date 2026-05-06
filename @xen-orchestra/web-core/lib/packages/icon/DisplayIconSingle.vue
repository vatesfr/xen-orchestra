<template>
  <svg
    v-if="icon.paths.length > 0"
    :viewBox="icon.viewBox"
    class="display-icon-single"
    :class="spinClass"
    v-bind="icon.bindings"
  >
    <path
      v-for="(path, index) of icon.paths"
      :key="index"
      :d="path"
      class="icon-path"
      :stroke="stroke ?? icon.config.borderColor"
      :stroke-width="stroke ? 64 : 32"
    />
  </svg>
</template>

<script lang="ts" setup>
import type { IconSingle } from './types.ts'
import { computed } from 'vue'

const { icon } = defineProps<{
  icon: IconSingle
  stroke?: string
}>()

const spinClass = computed(() => {
  return icon.bindings.style?.['--spin-duration'] ? 'spinning' : undefined
})
</script>

<style lang="postcss" scoped>
.display-icon-single {
  height: 1em;
  width: 1em;
  overflow: visible;
  grid-row: 1;
  grid-column: 1;

  &.spinning {
    animation-name: spin;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-duration: var(--spin-duration, 2s);
  }

  .icon-path {
    fill: currentColor;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
