<!-- v1.0 -->
<template>
  <button :class="[color, size, { disabled, active }]" :disabled class="button-icon" type="button">
    <UiIcon :icon class="icon" />
    <span v-if="dot" class="dot" />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    icon: IconDefinition
    size?: 'small' | 'medium' | 'large'
    color?: Color
    disabled?: boolean
    active?: boolean
    dot?: boolean
    targetScale?: number | { x: number; y: number }
  }>(),
  { color: 'info', size: 'medium', targetScale: 1 }
)

const cssTargetScale = computed(() => {
  if (typeof props.targetScale === 'number') {
    return `scale(${props.targetScale})`
  }

  return `scale(${props.targetScale.x}, ${props.targetScale.y})`
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.button-icon {
  &.info {
    & {
      --color: var(--color-purple-base);
      --background-color: transparent;
      --dot-color: var(--color-red-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-purple-base);
      --background-color: var(--background-color-purple-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-purple-d20);
      --background-color: var(--background-color-purple-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-purple-d40);
      --background-color: var(--background-color-purple-30);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-grey-400);
      --background-color: transparent;
    }
  }

  &.success {
    & {
      --color: var(--color-green-base);
      --background-color: transparent;
      --dot-color: var(--color-red-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-green-base);
      --background-color: var(--background-color-green-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-green-d20);
      --background-color: var(--background-color-green-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-green-d40);
      --background-color: var(--background-color-green-30);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-green-l60);
      --background-color: transparent;
    }
  }

  &.warning {
    & {
      --color: var(--color-orange-base);
      --background-color: transparent;
      --dot-color: var(--color-red-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-orange-base);
      --background-color: var(--background-color-orange-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-orange-d20);
      --background-color: var(--background-color-orange-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-orange-d40);
      --background-color: var(--background-color-orange-30);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-orange-l60);
      --background-color: transparent;
    }
  }

  &:is(.danger, .error) {
    & {
      --color: var(--color-red-base);
      --background-color: transparent;
      --dot-color: var(--color-orange-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-red-base);
      --background-color: var(--background-color-red-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-red-d20);
      --background-color: var(--background-color-red-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-red-d40);
      --background-color: var(--background-color-red-30);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-red-l60);
      --background-color: transparent;
    }
  }
}

/* SIZE VARIANTS */
.button-icon {
  &.small {
    --size: 1.6rem;
    --font-size: 1.2rem;
    --dot-size: 0.4rem;
    --dot-offset: 0.2rem;
  }

  &.medium {
    --size: 2.4rem;
    --font-size: 1.6rem;
    --dot-size: 0.5rem;
    --dot-offset: 0.4rem;
  }

  &.large {
    --size: 4rem;
    --font-size: 2.4rem;
    --dot-size: 0.8rem;
    --dot-offset: 0.8rem;
  }
}

/* IMPLEMENTATION */
.button-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: none;
  padding: 0;
  border-radius: 0.2rem;
  width: var(--size);
  height: var(--size);
  font-size: var(--font-size);
  color: var(--color);
  background-color: var(--background-color);
  position: relative;
  cursor: pointer;
  outline: none;

  &:is(:disabled, .disabled) {
    cursor: not-allowed;
  }

  .dot {
    position: absolute;
    display: block;
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 50%;
    background-color: var(--dot-color);
    top: var(--dot-offset);
    right: var(--dot-offset);
  }
}

/*
 * Increase the size of the clickable area,
 * without changing the padding of the ButtonIcon component
 */
.button-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: v-bind(cssTargetScale);
}
</style>
