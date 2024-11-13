<!-- v4 -->
<template>
  <label :class="variant" class="ui-radio-button typo p1-regular">
    <span class="radio-container">
      <input v-model="model" :value :disabled="isDisabled" class="input" type="radio" />
      <VtsIcon :icon="faCircle" accent="current" class="radio-icon" />
    </span>
    <slot />
  </label>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { toVariants } from '@core/utils/to-variants.util'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    accent: 'info' | 'success' | 'warning' | 'danger'
    value: any
    disabled?: boolean
  }>(),
  {
    disabled: undefined,
  }
)
const model = defineModel<boolean>()

defineSlots<{
  default(): any
}>()

const variant = computed(() => toVariants({ accent: props.accent }))

const isDisabled = useContext(DisabledContext, () => props.disabled)
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
        border: 0.2rem solid var(--color-info-txt-base);
        border-radius: 0.4rem;
      }
    }
    &:has(.input:disabled) {
      cursor: not-allowed;

      /*
      TODO: To be removed or kept after a decision has been taken
      See https://www.figma.com/design/l2O2VvzJRnOCvqxhM7d124?node-id=8-1940#1021964394
      */

      &:not(:has(.input:checked)) {
        --accent-color: var(--color-neutral-txt-secondary);
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
      opacity: 0;
      transition: opacity 0.125s ease-in-out;
      color: var(--color-neutral-txt-primary);
    }

    .input:disabled + .radio-icon {
      color: var(--color-neutral-txt-secondary);
    }

    .input:checked + .radio-icon {
      opacity: 1;
    }
  }

  /* ACCENT */

  &.accent--info {
    --accent-color: var(--color-info-item-base);

    &:hover {
      --accent-color: var(--color-info-item-hover);
    }

    &:active {
      --accent-color: var(--color-info-item-active);
    }

    &:has(.input:disabled) {
      --accent-color: var(--color-info-item-disabled);
    }
  }

  &.accent--success {
    --accent-color: var(--color-success-item-base);

    &:hover {
      --accent-color: var(--color-success-item-hover);
    }

    &:active {
      --accent-color: var(--color-success-item-active);
    }

    &:has(.input:disabled) {
      --accent-color: var(--color-success-item-disabled);
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

    &:has(.input:disabled) {
      --accent-color: var(--color-warning-item-disabled);
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

    &:has(.input:disabled) {
      --accent-color: var(--color-danger-item-disabled);
    }

    .radio-container .radio-icon {
      color: var(--color-danger-txt-item);
    }
  }
}
</style>
