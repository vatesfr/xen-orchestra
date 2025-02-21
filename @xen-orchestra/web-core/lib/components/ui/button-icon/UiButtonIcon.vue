<!-- WIP -->
<!-- TODO: Add complex icon -->
<template>
  <button :class="classNames" :disabled class="ui-button-icon" type="button">
    <VtsIcon :icon accent="current" />
    <span v-if="dot" class="dot" />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

type ButtonIconAccent = 'brand' | 'warning' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

const {
  accent,
  size,
  disabled,
  selected,
  targetScale = 1,
} = defineProps<{
  icon: IconDefinition
  size: ButtonSize
  accent: ButtonIconAccent
  disabled?: boolean
  selected?: boolean
  dot?: boolean
  targetScale?: number | { x: number; y: number }
}>()

const cssTargetScale = computed(() => {
  if (typeof targetScale === 'number') {
    return `scale(${targetScale})`
  }

  return `scale(${targetScale.x}, ${targetScale.y})`
})

const classNames = computed(() => {
  return [
    toVariants({
      accent,
      size,
      muted: disabled,
      selected,
    }),
  ]
})
</script>

<style lang="postcss" scoped>
.ui-button-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: none;
  padding: 0;
  border-radius: 0.2rem;
  position: relative;
  cursor: pointer;
  outline: none;

  &:disabled {
    cursor: not-allowed;
  }

  .dot {
    position: absolute;
    display: block;
    border-radius: 50%;
    background-color: var(--color-danger-txt-base);
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.2rem;
      border-radius: 0.4rem;
      border-width: 0.2rem;
      border-style: solid;
    }
  }

  /* ACCENT VARIANTS */

  &.accent--brand {
    & {
      color: var(--color-brand-txt-base);
      background-color: transparent;
    }

    &:hover {
      color: var(--color-brand-txt-hover);
      background-color: var(--color-brand-background-hover);
    }

    &:focus-visible::before {
      border-color: var(--color-brand-txt-base);
    }

    &:active {
      color: var(--color-brand-txt-active);
      background-color: var(--color-brand-background-active);
    }

    &.selected {
      color: var(--color-brand-txt-base);
      background-color: var(--color-brand-background-selected);
    }

    &.muted {
      color: var(--color-neutral-txt-secondary);
      background-color: transparent;
    }
  }

  &.accent--warning {
    & {
      color: var(--color-warning-txt-base);
      background-color: transparent;
    }

    &:hover {
      color: var(--color-warning-txt-hover);
      background-color: var(--color-warning-background-hover);
    }

    &:focus-visible::before {
      border-color: var(--color-brand-txt-base);
    }

    &:active {
      color: var(--color-warning-txt-active);
      background-color: var(--color-warning-background-active);
    }

    &.selected {
      color: var(--color-warning-txt-base);
      background-color: var(--color-warning-background-selected);
    }

    &.muted {
      color: var(--color-neutral-txt-secondary);
      background-color: transparent;
    }
  }

  &.accent--danger {
    & {
      color: var(--color-danger-txt-base);
      background-color: transparent;

      .dot {
        background-color: var(--color-warning-txt-base);
      }
    }

    &:hover {
      color: var(--color-danger-txt-hover);
      background-color: var(--color-danger-background-hover);
    }

    &:focus-visible::before {
      border-color: var(--color-brand-txt-base);
    }

    &:active {
      color: var(--color-danger-txt-active);
      background-color: var(--color-danger-background-active);
    }

    &.selected {
      color: var(--color-danger-txt-base);
      background-color: var(--color-danger-background-selected);
    }

    &.muted {
      color: var(--color-neutral-txt-secondary);
      background-color: transparent;
    }
  }

  /* SIZE VARIANTS */

  &.size--small {
    & {
      width: 1.6rem;
      height: 1.6rem;
      font-size: 1.2rem;
    }

    .dot {
      width: 0.4rem;
      height: 0.4rem;
      top: 0.2rem;
      right: 0.2rem;
    }
  }

  &.size--medium {
    & {
      width: 2.4rem;
      height: 2.4rem;
      font-size: 1.6rem;
    }

    .dot {
      width: 0.5rem;
      height: 0.5rem;
      top: 0.4rem;
      right: 0.4rem;
    }
  }

  &.size--large {
    & {
      width: 4rem;
      height: 4rem;
      font-size: 2.4rem;
    }

    .dot {
      width: 0.8rem;
      height: 0.8rem;
      top: 0.8rem;
      right: 0.8rem;
    }
  }

  /*
   * Increase the size of the clickable area,
   * without changing the padding of the ButtonIcon component
  */

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: v-bind(cssTargetScale);
  }
}
</style>
