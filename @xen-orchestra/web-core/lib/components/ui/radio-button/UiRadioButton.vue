<!-- v7 -->
<template>
  <label :class="variant" class="ui-radio-button typo-body-regular">
    <span class="radio">
      <input v-model="model" :disabled="isDisabled" :value class="input" type="radio" />
      <VtsIcon name="status:radio-button" size="medium" />
    </span>
    <slot />
  </label>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { accent, value, disabled } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  value: any
  disabled?: boolean
}>()

const model = defineModel<string>()

defineSlots<{
  default(): any
}>()

const variant = computed(() => toVariants({ accent }))

const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-radio-button {
  --radio-dot-color: var(--color-neutral-background-primary);
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;

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
    --radio-color: var(--color-brand-txt-base);

    &:hover {
      --radio-color: var(--color-brand-txt-hover);
    }

    &:active {
      --radio-color: var(--color-brand-txt-active);
    }
  }

  &.accent--warning {
    --radio-color: var(--color-warning-txt-base);

    &:hover {
      --radio-color: var(--color-warning-txt-hover);
    }

    &:active {
      --radio-color: var(--color-warning-txt-active);
    }
  }

  &.accent--danger {
    --radio-color: var(--color-danger-txt-base);

    &:hover {
      --radio-color: var(--color-danger-txt-hover);
    }

    &:active {
      --radio-color: var(--color-danger-txt-active);
    }
  }

  /* DISABLED */

  &:has(.input:disabled) {
    cursor: not-allowed;
    color: var(--color-neutral-txt-secondary);
    --radio-color: var(--color-neutral-txt-secondary);
    --radio-dot-color: var(--color-neutral-background-disabled);
  }
}
</style>
