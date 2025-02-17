<!-- v4 -->
<template>
  <label :class="variant" class="ui-radio-button typo p1-regular">
    <span class="radio-container">
      <input v-model="model" :disabled="isDisabled" :value class="input" type="radio" />
      <VtsIcon :icon="faCircle" accent="current" class="radio-icon" />
    </span>
    <slot />
  </label>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { toVariants } from '@core/utils/to-variants.util'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { accent, value, disabled } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  value: any
  disabled?: boolean
}>()

const model = defineModel<boolean>()

defineSlots<{
  default(): any
}>()

const variant = computed(() => toVariants({ accent }))

const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-radio-button {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;

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
      background-color: var(--accent-color);
    }

    /* INPUT */

    .input {
      opacity: 0;
      position: absolute;
      pointer-events: none;
    }

    /* ICON */

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
    --accent-color: var(--color-brand-item-base);

    &:hover {
      --accent-color: var(--color-brand-item-hover);
    }

    &:active {
      --accent-color: var(--color-brand-item-active);
    }

    &:has(.input:checked:not(:disabled)) {
      .radio-icon {
        --radio-icon-color: var(--color-brand-txt-item);
      }
    }
  }

  &.accent--warning {
    --accent-color: var(--color-warning-item-base);

    &:hover {
      --accent-color: var(--color-warning-item-hover);
    }

    &:active {
      --accent-color: var(--color-warning-item-active);
    }

    &:has(.input:checked:not(:disabled)) {
      .radio-icon {
        --radio-icon-color: var(--color-warning-txt-item);
      }
    }
  }

  &.accent--danger {
    --accent-color: var(--color-danger-item-base);

    &:hover {
      --accent-color: var(--color-danger-item-hover);
    }

    &:active {
      --accent-color: var(--color-danger-item-active);
    }

    &:has(.input:checked:not(:disabled)) {
      .radio-icon {
        --radio-icon-color: var(--color-danger-txt-item);
      }
    }
  }

  /* DISABLED */

  &:has(.input:disabled) {
    cursor: not-allowed;
    --accent-color: var(--color-neutral-txt-secondary);
  }
}
</style>
