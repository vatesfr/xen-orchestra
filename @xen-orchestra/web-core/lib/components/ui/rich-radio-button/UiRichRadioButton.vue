<!-- v1 -->
<template>
  <div :class="toVariants({ accent, size, disabled })" class="ui-rich-radio-button">
    <div class="container">
      <slot />
    </div>
    <div class="label">
      <UiRadioButton :accent="accent" :value="value" :disabled="disabled">
        <slot name="label" />
      </UiRadioButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'

defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  value: any
  disabled?: boolean
  size: RichRadioButtonSize
}>()

export type RichRadioButtonSize = 'small' | 'medium'
</script>

<style lang="postcss" scoped>
.ui-rich-radio-button {
  border: 0.1rem solid;
  border-radius: 0.4rem;
  overflow: hidden;

  .container {
    border-bottom: 0.1rem solid;
    overflow: hidden;
    border-color: inherit;
  }

  .label {
    display: flex;
    align-items: center;
    padding: 1.6rem;
    background-color: var(--color-neutral-background-primary);
  }

  /* ACCENT */

  &.accent--brand {
    border-color: var(--color-neutral-border);

    &:has(input:checked:not(:disabled)) {
      border-color: var(--color-brand-item-base);
    }

    &:hover:not(:has(input:disabled)),
    :has(.label:hover) &:not(:has(input:disabled)),
    :has(.label:hover) .container:not(:has(input:disabled)) {
      border-color: var(--color-brand-txt-hover);
    }

    &:has(input:active:not(:disabled)) {
      border-color: var(--color-brand-txt-active);
    }
  }

  &.accent--warning {
    border-color: var(--color-warning-txt-base);

    &:has(input:checked:not(:disabled)) {
      border-color: var(--color-warning-item-base);
    }

    &:hover:not(:has(input:disabled)),
    :has(.label:hover) &:not(:has(input:disabled)),
    :has(.label:hover) .container:not(:has(input:disabled)) {
      border-color: var(--color-warning-txt-hover);
    }

    &:has(input:active:not(:disabled)) {
      border-color: var(--color-warning-txt-active);
    }
  }

  &.accent--danger {
    border-color: var(--color-danger-txt-base);

    &:has(input:checked:not(:disabled)) {
      border-color: var(--color-danger-item-base);
    }

    &:hover:not(:has(input:disabled)),
    :has(.label:hover) &:not(:has(input:disabled)),
    :has(.label:hover) .container:not(:has(input:disabled)) {
      border-color: var(--color-danger-txt-hover);
    }

    &:has(input:active:not(:disabled)) {
      border-color: var(--color-danger-txt-active);
    }
  }

  /* DISABLED */

  &:has(input:disabled),
  &:has(input:disabled) .container,
  &:has(input:disabled) .label {
    cursor: not-allowed;
    border-color: var(--color-neutral-border);
    background-color: var(--color-neutral-background-disabled);
  }

  /* SIZE */

  &.size--small {
    height: 16.4rem;
    width: 12.8rem;

    .container {
      height: 10.8rem;
    }

    .label {
      height: 5.6rem;
    }
  }

  &.size--medium {
    height: 25.6rem;
    width: 20rem;

    .container {
      height: 20rem;
    }

    .label {
      height: 5.6rem;
    }
  }
}
</style>
