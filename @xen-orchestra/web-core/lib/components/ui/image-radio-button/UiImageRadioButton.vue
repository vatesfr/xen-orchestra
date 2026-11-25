<!-- v1 -->
<template>
  <label :class="variants" class="ui-image-radio-button typo-body-regular">
    <span class="image">
      <img :src :alt />
    </span>
    <span class="radio-wrapper typo-body-regular">
      <span class="radio">
        <input v-model="model" :disabled="isDisabled" :value class="input" type="radio" />
        <VtsIcon name="status:radio-button" size="medium" />
      </span>
      <slot />
    </span>
  </label>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { accent, value, disabled, size } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  size: 'small' | 'medium'
  value: unknown
  src: string
  alt: string
  disabled?: boolean
}>()

const model = defineModel<string>()

defineSlots<{
  default(): any
}>()

const variants = computed(() => toVariants({ accent, size }))
const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-image-radio-button {
  --radio-color: var(--accent-color);
  --radio-dot-color: var(--color-neutral-background-primary);
  cursor: pointer;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.4rem;
  overflow: hidden;

  .image {
    border-bottom: 0.1rem solid;
    border-color: inherit;
    overflow: hidden;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .radio {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    border-radius: 50%;
    color: var(--radio-color);
    transition:
      color 0.125s ease-in-out,
      background-color 0.125s ease-in-out;

    &:has(.input:checked) {
      background-color: var(--radio-color);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        width: 0.6rem;
        height: 0.6rem;
        margin: auto;
        border-radius: 50%;
        background-color: var(--radio-dot-color);
      }
    }

    &:has(.input:focus-visible)::before {
      content: '';
      position: absolute;
      inset: -0.4rem;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }

    .input {
      opacity: 0;
      position: absolute;
      pointer-events: none;
    }
  }

  /* ACCENT */

  &.accent--brand {
    --accent-color: var(--color-brand-txt-base);
    --accent-hover-color: var(--color-brand-txt-hover);
    --accent-checked-color: var(--color-brand-item-base);
    --accent-active-color: var(--color-brand-txt-active);
  }

  &.accent--warning {
    --accent-color: var(--color-warning-txt-base);
    --accent-hover-color: var(--color-warning-txt-hover);
    --accent-checked-color: var(--color-warning-item-base);
    --accent-active-color: var(--color-warning-txt-active);
  }

  &.accent--danger {
    --accent-color: var(--color-danger-txt-base);
    --accent-hover-color: var(--color-danger-txt-hover);
    --accent-checked-color: var(--color-danger-item-base);
    --accent-active-color: var(--color-danger-txt-active);
  }

  /* DISABLED */

  &:has(.input:disabled) {
    cursor: not-allowed;
    --accent-color: var(--color-neutral-txt-secondary);
    --radio-dot-color: var(--color-neutral-background-disabled);
  }
  .radio-wrapper {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1.6rem;
    background-color: var(--color-neutral-background-primary);
    cursor: pointer;
  }

  /* INITIAL BORDER EXCEPT BRAND */

  &.accent--warning,
  &.accent--danger {
    border-color: var(--accent-color);
  }

  /* CHECKED STATE */

  &:has(input:checked:not(:disabled)) {
    border-color: var(--accent-checked-color);
  }

  /* HOVER STATE */

  &:hover:not(:has(input:disabled)) {
    --radio-color: var(--accent-hover-color);
    border-color: var(--accent-hover-color);
  }

  /* ACTIVE STATE */

  &:active:not(:has(input:disabled)) {
    --radio-color: var(--accent-active-color);
    border-color: var(--accent-active-color);
  }

  /* DISABLED STATE */

  &:has(input:disabled) {
    border-color: var(--color-neutral-border);

    .image {
      opacity: 0.5;
    }

    .radio-wrapper {
      background-color: var(--color-neutral-background-disabled);
      cursor: not-allowed;
    }
  }

  /* SIZES */

  &.size--small {
    height: 16.4rem;
    width: 12.8rem;

    .image {
      height: 10.8rem;
    }

    .radio-wrapper {
      height: 5.6rem;
    }
  }

  &.size--medium {
    height: 25.6rem;
    width: 20rem;

    .image {
      height: 20rem;
    }

    .radio-wrapper {
      height: 5.6rem;
    }
  }
}
</style>
