<!-- v10 -->
<!-- TODO: Add complex icon -->
<template>
  <button :class="classNames" :disabled class="ui-button-icon" type="button">
    <VtsIcon :name="icon" size="current" />
    <UiCounter v-if="counterProps !== undefined" v-bind="counterProps" size="small" variant="primary" class="counter" />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCounter, { type CounterAccent, type CounterValue } from '@core/components/ui/counter/UiCounter.vue'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type ButtonIconAccent = 'brand' | 'info' | 'warning' | 'danger'

export type ButtonIconSize = 'small' | 'medium' | 'large'

const { accent, size, disabled, selected, counter, targetScale } = defineProps<{
  icon: IconName
  size: ButtonIconSize
  accent: ButtonIconAccent
  disabled?: boolean
  selected?: boolean
  counter?: CounterValue | { value: CounterValue; accent: CounterAccent }
  targetScale?: number | { x: number; y: number }
}>()

const counterProps = computed(() => {
  if (counter === undefined) {
    return undefined
  }

  if (typeof counter === 'object') {
    return counter
  }

  return { value: counter, accent: 'info' } as const
})

const cssTargetScale = computed(() => {
  const scale = targetScale ?? (size === 'small' ? 1.6 : 1)

  if (typeof scale === 'number') {
    return `scale(${scale})`
  }

  return `scale(${scale.x}, ${scale.y})`
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

  .counter {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
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

  &.accent--info {
    & {
      color: var(--color-info-txt-base);
      background-color: transparent;
    }

    &:hover {
      color: var(--color-info-txt-hover);
      background-color: var(--color-info-background-hover);
    }

    &:focus-visible::before {
      border-color: var(--color-brand-txt-base);
    }

    &:active {
      color: var(--color-info-txt-active);
      background-color: var(--color-info-background-active);
    }

    &.selected {
      color: var(--color-info-txt-base);
      background-color: var(--color-info-background-selected);
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
    width: 2.4rem;
    height: 2.4rem;
    font-size: 1.6rem;
  }

  &.size--medium {
    width: 3.2rem;
    height: 3.2rem;
    font-size: 2rem;
  }

  &.size--large {
    width: 4rem;
    height: 4rem;
    font-size: 3.2rem;
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
