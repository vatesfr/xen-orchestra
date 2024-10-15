<!-- v1.0 -->
<template>
  <button :class="[color, size, { disabled, active }]" :disabled class="button-icon" type="button">
    <VtsIcon :icon accent="current" />
    <span v-if="dot" class="dot" />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
  { color: 'normal', size: 'medium', targetScale: 1 }
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
  &.normal {
    & {
      --color: var(--color-info-txt-base);
      --background-color: transparent;
      --dot-color: var(--color-danger-txt-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-info-txt-base);
      --background-color: var(--color-info-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-info-txt-hover);
      --background-color: var(--color-info-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-info-txt-active);
      --background-color: var(--color-info-background-active);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-neutral-txt-secondary);
      --background-color: transparent;
    }
  }

  &.success {
    & {
      --color: var(--color-success-txt-base);
      --background-color: transparent;
      --dot-color: var(--color-danger-txt-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-success-txt-base);
      --background-color: var(--color-success-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-success-txt-hover);
      --background-color: var(--color-success-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-success-txt-active);
      --background-color: var(--color-success-background-active);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-neutral-txt-secondary);
      --background-color: transparent;
    }
  }

  &.warning {
    & {
      --color: var(--color-warning-txt-base);
      --background-color: transparent;
      --dot-color: var(--color-danger-txt-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-warning-txt-base);
      --background-color: var(--color-warning-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-warning-txt-hover);
      --background-color: var(--color-warning-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-warning-txt-active);
      --background-color: var(--color-warning-background-active);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-neutral-txt-secondary);
      --background-color: transparent;
    }
  }

  &:is(.danger, .error) {
    & {
      --color: var(--color-danger-txt-base);
      --background-color: transparent;
      --dot-color: var(--color-warning-txt-base);
    }

    &:is(.active, .selected) {
      --color: var(--color-danger-txt-base);
      --background-color: var(--color-danger-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-danger-txt-hover);
      --background-color: var(--color-danger-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-danger-txt-active);
      --background-color: var(--color-danger-background-active);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-neutral-txt-secondary);
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
