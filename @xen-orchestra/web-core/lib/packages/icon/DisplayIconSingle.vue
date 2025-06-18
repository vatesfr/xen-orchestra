<template>
  <svg v-if="icon.paths.length > 0" :viewBox="icon.viewBox" class="display-icon-single" v-bind="icon.bindings">
    <path
      v-for="(path, index) of icon.paths"
      :key="index"
      :d="path"
      class="icon-path"
      :stroke="stroke ?? icon.config.borderColor"
      :stroke-width="stroke ? 64 : 16"
    />
  </svg>
</template>

<script lang="ts" setup>
import type { IconSingle } from './types.ts'

defineProps<{
  icon: IconSingle
  stroke?: string
}>()
</script>

<style lang="postcss" scoped>
.display-icon-single {
  height: 1em;
  width: 1em;
  overflow: visible;
  grid-row: 1;
  grid-column: 1;

  .icon-path {
    fill: currentColor;
  }
}
</style>
