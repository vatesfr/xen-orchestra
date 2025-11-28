<!-- v4 -->
<template>
  <label v-if="!rich" :class="variants" class="ui-radio-button typo-body-regular">
    <span class="radio-container">
      <input v-model="model" :disabled="isDisabled" :value class="input" type="radio" />
      <VtsIcon name="fa:circle" size="medium" class="radio-icon" />
    </span>
    <slot />
  </label>

  <div v-else :class="variants" class="ui-radio-button ui-rich-radio-button">
    <div class="rich-image">
      <img :src="src" :alt="alt" />
    </div>
    <label class="rich-label typo-body-regular">
      <span class="radio-container">
        <input v-model="model" :disabled="isDisabled" :value class="input" type="radio" />
        <VtsIcon name="fa:circle" size="small" class="radio-icon" />
      </span>
      <slot />
    </label>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

const { accent, value, disabled, size } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  value: unknown
  disabled?: boolean
  rich?: boolean
  src?: string
  alt?: string
  size?: 'small' | 'medium'
}>()

const model = defineModel<string>()

defineSlots<{
  default(): any
}>()

const variants = computed(() => [toVariants({ accent }), toVariants({ size })])

const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-radio-button {
  cursor: pointer;

  .radio-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0.2rem solid var(--accent-color);
    background-color: transparent;
    border-radius: 0.8rem;
    width: 1.6rem;
    height: 1.6rem;
    position: relative;
    transition:
      border-color 0.125s ease-in-out,
      background-color 0.125s ease-in-out;

    &:has(input:focus-visible) {
      outline: none;

      &::after {
        position: absolute;
        content: '';
        inset: -0.5rem;
        border: 0.2rem solid var(--color-brand-txt-base);
        border-radius: 0.4rem;
      }
    }

    &:has(.input:checked) {
      border-color: var(--accent-checked-color);
      background-color: var(--accent-checked-color);
    }

    .input {
      opacity: 0;
      position: absolute;
      pointer-events: none;
    }

    .radio-icon {
      font-size: 0.8rem;
      position: absolute;
      transition: font-size 0.125s ease-in-out;
      color: var(--radio-icon-color);
      --radio-icon-color: var(--color-neutral-background-primary);
    }

    .input:not(:checked) + .radio-icon {
      font-size: 1.2rem;
    }

    .input:disabled + .radio-icon {
      --radio-icon-color: var(--color-neutral-background-disabled);
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
  }

  /*  NO RICH STYLE */

  &:not(.ui-rich-radio-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;

    &:hover:not(:has(.input:disabled)) {
      --accent-color: var(--accent-hover-color);
    }

    &:has(.input:active:not(:disabled)) {
      --accent-color: var(--accent-active-color);
    }
  }
}

/* RICH RADIO BUTTON */

.ui-rich-radio-button {
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.4rem;
  overflow: hidden;

  .rich-image {
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

  .rich-label {
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

    .radio-container {
      border-color: var(--accent-checked-color);
      background-color: var(--accent-checked-color);
    }
  }

  /* HOVER STATE */

  &:hover:not(:has(input:disabled)) {
    border-color: var(--accent-hover-color);

    .radio-container {
      border-color: var(--accent-hover-color);
    }
    .radio-container:has(.input:checked) {
      background-color: var(--accent-hover-color);
    }
  }

  /* ACTIVE STATE */

  &:active:not(:has(input:disabled)) {
    .radio-container {
      border-color: var(--accent-active-color);
    }
    .radio-container:has(.input:checked) {
      background-color: var(--accent-active-color);
    }
  }

  /* DISABLED STATE */

  &:has(input:disabled) {
    border-color: var(--color-neutral-border);

    .rich-image {
      opacity: 0.5;
    }

    .rich-label {
      background-color: var(--color-neutral-background-disabled);
      cursor: not-allowed;
    }
  }

  /* SIZE FOR RICH */

  &.size--small {
    height: 16.4rem;
    width: 12.8rem;

    .rich-image {
      height: 10.8rem;
    }

    .rich-label {
      height: 5.6rem;
    }
  }

  &.size--medium {
    height: 25.6rem;
    width: 20rem;

    .rich-image {
      height: 20rem;
    }

    .rich-label {
      height: 5.6rem;
    }
  }
}
</style>
