<template>
  <div class="ui-progress-bar" :class="`color-${color}`">
    <div class="fill" />
  </div>
</template>

<script lang="ts" setup>
import type { Color } from '@/types'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    color?: Color | 'custom'
    maxValue?: number
  }>(),
  { color: 'info', maxValue: 100 }
)

const cssFillWidth = computed(() => {
  const progress = (props.value / props.maxValue) * 100
  return `${progress}%`
})
</script>

<style lang="postcss" scoped>
.ui-progress-bar {
  overflow: hidden;
  height: var(--progress-bar-height, 0.4rem);
  margin: 1rem 0;
  border-radius: 0.4rem;
  background-color: var(--progress-bar-background-color, var(--color-info-background-selected));

  &.color-info {
    --progress-bar-color: var(--color-info-item-base);
  }

  &.color-success {
    --progress-bar-color: var(--color-success-item-base);
  }

  &.color-warning {
    --progress-bar-color: var(--color-warning-item-base);
  }

  &.color-error {
    --progress-bar-color: var(--color-danger-item-base);
  }
}

.fill {
  width: v-bind(cssFillWidth);
  height: var(--progress-bar-height, 0.4rem);
  transition: width 1s ease-in-out;
  background-color: var(--progress-bar-color);
}
</style>
