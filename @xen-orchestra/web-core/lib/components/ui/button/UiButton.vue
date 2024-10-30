<!-- v4 -->
<template>
  <button :class="classNames" :disabled="busy || isDisabled" class="ui-button" type="button">
    <VtsIcon :busy :icon="leftIcon" accent="current" class="icon" fixed-width />
    <slot />
    <VtsIcon :icon="rightIcon" accent="current" class="icon" fixed-width />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'
type ButtonAccent = 'info' | 'success' | 'warning' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

const props = withDefaults(
  defineProps<{
    variant: ButtonVariant
    accent: ButtonAccent
    size: ButtonSize
    busy?: boolean
    disabled?: boolean
    leftIcon?: IconDefinition
    rightIcon?: IconDefinition
  }>(),
  {
    disabled: undefined,
  }
)

defineSlots<{
  default(): any
}>()

const isDisabled = useContext(DisabledContext, () => props.disabled)

const fontClasses = {
  small: 'typo p3-medium',
  medium: 'typo h6-medium',
  large: 'typo h3-semi-bold',
}

const classNames = computed(() => [
  fontClasses[props.size],
  toVariants({
    accent: props.accent,
    variant: props.variant,
    size: props.size,
    busy: props.busy,
    disabled: isDisabled.value,
  }),
])
</script>

<style lang="postcss" scoped>
/* IMPLEMENTATION */
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  vertical-align: middle;
  gap: 0.75em;
  border-width: 0.1rem;
  outline: none;
  border-style: solid;

  &.busy,
  &.disabled {
    cursor: not-allowed;
  }

  /* ACCENT + VARIANT */

  &.accent--info {
    &.variant--primary {
      background-color: var(--color-normal-item-base);
      border-color: var(--color-normal-item-base);
      color: var(--color-normal-txt-item);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-normal-item-hover);
        border-color: var(--color-normal-item-hover);
        color: var(--color-normal-txt-item);
      }

      &:active {
        background-color: var(--color-normal-item-active);
        border-color: var(--color-normal-item-active);
        color: var(--color-normal-txt-item);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-normal-item-disabled);
        border-color: var(--color-normal-item-disabled);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-normal-item-base);
        border-color: var(--color-normal-item-base);
        color: var(--color-normal-txt-item);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-normal-item-base);
      color: var(--color-normal-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-normal-item-hover);
        color: var(--color-normal-txt-hover);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-normal-item-active);
        color: var(--color-normal-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-txt-secondary);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-normal-item-base);
        color: var(--color-normal-txt-base);
      }
    }

    &.variant--tertiary {
      background-color: transparent;
      border-color: transparent;
      color: var(--color-normal-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-normal-background-hover);
        border-color: var(--color-normal-background-hover);
        color: var(--color-normal-txt-hover);
      }

      &:active {
        background-color: var(--color-normal-background-active);
        border-color: var(--color-normal-background-active);
        color: var(--color-normal-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-normal-background-selected);
        border-color: var(--color-normal-background-selected);
        color: var(--color-normal-txt-base);
      }
    }
  }

  &.accent--success {
    &.variant--primary {
      background-color: var(--color-success-item-base);
      border-color: var(--color-success-item-base);
      color: var(--color-success-txt-item);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-success-item-hover);
        border-color: var(--color-success-item-hover);
        color: var(--color-success-txt-item);
      }

      &:active {
        background-color: var(--color-success-item-active);
        border-color: var(--color-success-item-active);
        color: var(--color-success-txt-item);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-success-item-disabled);
        border-color: var(--color-success-item-disabled);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-success-item-base);
        border-color: var(--color-success-item-base);
        color: var(--color-success-txt-item);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-success-txt-base);
      color: var(--color-success-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-success-txt-hover);
        color: var(--color-success-txt-hover);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-success-txt-active);
        color: var(--color-success-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-txt-secondary);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-success-txt-base);
        color: var(--color-success-txt-base);
      }
    }

    &.variant--tertiary {
      background-color: transparent;
      border-color: transparent;
      color: var(--color-success-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-success-background-hover);
        border-color: var(--color-success-background-hover);
        color: var(--color-success-txt-hover);
      }

      &:active {
        background-color: var(--color-success-background-active);
        border-color: var(--color-success-background-active);
        color: var(--color-success-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-success-background-selected);
        border-color: var(--color-success-background-selected);
        color: var(--color-success-txt-base);
      }
    }
  }

  &.accent--warning {
    &.variant--primary {
      background-color: var(--color-warning-item-base);
      border-color: var(--color-warning-item-base);
      color: var(--color-warning-txt-item);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-warning-item-hover);
        border-color: var(--color-warning-item-hover);
        color: var(--color-warning-txt-item);
      }

      &:active {
        background-color: var(--color-warning-item-active);
        border-color: var(--color-warning-item-active);
        color: var(--color-warning-txt-item);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-warning-item-disabled);
        border-color: var(--color-warning-item-disabled);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-warning-item-base);
        border-color: var(--color-warning-item-base);
        color: var(--color-warning-txt-item);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-warning-txt-base);
      color: var(--color-warning-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-warning-txt-hover);
        color: var(--color-warning-txt-hover);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-warning-txt-active);
        color: var(--color-warning-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-txt-secondary);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-warning-txt-base);
        color: var(--color-warning-txt-base);
      }
    }

    &.variant--tertiary {
      background-color: transparent;
      border-color: transparent;
      color: var(--color-warning-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-warning-background-hover);
        border-color: var(--color-warning-background-hover);
        color: var(--color-warning-txt-hover);
      }

      &:active {
        background-color: var(--color-warning-background-active);
        border-color: var(--color-warning-background-active);
        color: var(--color-warning-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-warning-background-selected);
        border-color: var(--color-warning-background-selected);
        color: var(--color-warning-txt-base);
      }
    }
  }

  &.accent--danger {
    &.variant--primary {
      background-color: var(--color-danger-item-base);
      border-color: var(--color-danger-item-base);
      color: var(--color-danger-txt-item);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-danger-item-hover);
        border-color: var(--color-danger-item-hover);
        color: var(--color-danger-txt-item);
      }

      &:active {
        background-color: var(--color-danger-item-active);
        border-color: var(--color-danger-item-active);
        color: var(--color-danger-txt-item);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-danger-item-disabled);
        border-color: var(--color-danger-item-disabled);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-danger-item-base);
        border-color: var(--color-danger-item-base);
        color: var(--color-danger-txt-item);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-danger-txt-base);
      color: var(--color-danger-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-danger-txt-hover);
        color: var(--color-danger-txt-hover);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-danger-txt-active);
        color: var(--color-danger-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-txt-secondary);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-danger-txt-base);
        color: var(--color-danger-txt-base);
      }
    }

    &.variant--tertiary {
      background-color: transparent;
      border-color: transparent;
      color: var(--color-danger-txt-base);

      &:is(:hover, :focus-visible) {
        background-color: var(--color-danger-background-hover);
        border-color: var(--color-danger-background-hover);
        color: var(--color-danger-txt-hover);
      }

      &:active {
        background-color: var(--color-danger-background-active);
        border-color: var(--color-danger-background-active);
        color: var(--color-danger-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-danger-background-selected);
        border-color: var(--color-danger-background-selected);
        color: var(--color-danger-txt-base);
      }
    }
  }

  /* SIZE */

  &.size--small {
    padding: 0.4rem 0.8rem;
    border-radius: 0.2rem;
  }

  &.size--medium {
    padding: 0.8rem 1.6rem;
    border-radius: 0.4rem;
  }

  &.size--large {
    padding: 1.6rem 2.4rem;
    border-radius: 0.8rem;
  }

  .icon {
    font-size: 0.8em;
  }
}
</style>
