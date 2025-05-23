<template>
  <svg v-if="icon.paths.length > 0" :viewBox="icon.viewBox" class="display-icon-single" v-bind="icon.bindings">
    <template v-if="icon.config.borderColor">
      <path
        v-for="(path, index) of icon.paths"
        :key="index"
        :d="path"
        :stroke="icon.config.borderColor"
        class="border-path"
      />
    </template>
    <path v-for="(path, index) of icon.paths" :key="index" :d="path" class="icon-path" />
  </svg>
</template>

<script lang="ts" setup>
import type { IconSingle } from './types.ts'

defineProps<{
  icon: IconSingle
}>()
</script>

<style lang="postcss" scoped>
.display-icon-single {
  height: 1em;
  width: 1em;
  overflow: visible;
  grid-row: 1;
  grid-column: 1;

  .border-path {
    stroke-width: 64;
  }

  .icon-path {
    fill: currentColor;
  }
}
</style>
