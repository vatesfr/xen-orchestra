<template>
  <div class="ui-card" :class="color">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { Color } from '@core/types/color.type'

defineProps<{
  color?: Color
}>()
</script>

<style lang="postcss" scoped>
.ui-card {
  padding: 2.1rem;
  border-radius: 0.8rem;
  box-shadow: var(--shadow-200);
  background-color: var(--background-color);
  --background-color: var(--background-color-primary);

  &.info {
    --background-color: var(--background-color-purple-10);
  }

  &.success {
    --background-color: var(--background-color-green-10);
  }

  &.warning {
    --background-color: var(--background-color-orange-10);
  }

  &.error,
  &.danger {
    --background-color: var(--background-color-red-10);
  }
}
</style>
