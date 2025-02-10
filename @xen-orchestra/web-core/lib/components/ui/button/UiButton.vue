<!-- v6 -->
<template>
  <button :class="classNames" :disabled="busy || isDisabled || lockIcon" class="ui-button" type="button">
    <VtsIcon :busy :icon="leftIcon" accent="current" class="icon" fixed-width />
    <slot />
    <VtsIcon v-if="lockIcon" :icon="faLock" accent="current" class="icon" fixed-width />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'
type ButtonAccent = 'brand' | 'warning' | 'danger'
type ButtonSize = 'small' | 'medium'

const props = defineProps<{
  variant: ButtonVariant
  accent: ButtonAccent
  size: ButtonSize
  busy?: boolean
  disabled?: boolean
  lockIcon?: boolean
  leftIcon?: IconDefinition
}>()

defineSlots<{
  default(): any
}>()

const isDisabled = useDisabled(() => props.disabled)

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
    lock: props.lockIcon,
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

  &.lock {
    cursor: default;
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.5rem;
      border-radius: 0.4rem;
      border-width: 0.2rem;
      border-style: solid;
    }
  }

  .icon {
    font-size: 0.8em;
  }

  /* ACCENT + VARIANT */

  &.accent--brand {
    &.variant--primary {
      background-color: var(--color-brand-item-base);
      border-color: var(--color-brand-item-base);
      color: var(--color-brand-txt-item);

      &:hover {
        background-color: var(--color-brand-item-hover);
        border-color: var(--color-brand-item-hover);
        color: var(--color-brand-txt-item);
      }

      &:focus-visible::before {
        border-color: var(--color-info-txt-base);
      }

      &:active {
        background-color: var(--color-brand-item-active);
        border-color: var(--color-brand-item-active);
        color: var(--color-brand-txt-item);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-brand-item-disabled);
        border-color: var(--color-brand-item-disabled);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-brand-item-base);
        border-color: var(--color-brand-item-base);
        color: var(--color-brand-txt-item);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-brand-item-base);
      color: var(--color-brand-txt-base);

      &:hover {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-brand-item-hover);
        color: var(--color-brand-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-info-txt-base);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-brand-item-active);
        color: var(--color-brand-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-txt-secondary);
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-brand-item-base);
        color: var(--color-brand-txt-base);
      }
    }

    &.variant--tertiary {
      background-color: transparent;
      border-color: transparent;
      color: var(--color-brand-txt-base);

      &:hover {
        background-color: var(--color-brand-background-hover);
        border-color: var(--color-brand-background-hover);
        color: var(--color-brand-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-info-txt-base);
      }

      &:active {
        background-color: var(--color-brand-background-active);
        border-color: var(--color-brand-background-active);
        color: var(--color-brand-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: transparent;
        border-color: transparent;
        color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        background-color: var(--color-brand-background-selected);
        border-color: var(--color-brand-background-selected);
        color: var(--color-brand-txt-base);
      }
    }
  }

  &.accent--warning {
    &.variant--primary {
      background-color: var(--color-warning-item-base);
      border-color: var(--color-warning-item-base);
      color: var(--color-warning-txt-item);

      &:hover {
        background-color: var(--color-warning-item-hover);
        border-color: var(--color-warning-item-hover);
        color: var(--color-warning-txt-item);
      }

      &:focus-visible::before {
        border-color: var(--color-warning-txt-base);
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

      &:hover {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-warning-txt-hover);
        color: var(--color-warning-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-warning-txt-base);
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

      &:hover {
        background-color: var(--color-warning-background-hover);
        border-color: var(--color-warning-background-hover);
        color: var(--color-warning-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-warning-txt-base);
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

      &:hover {
        background-color: var(--color-danger-item-hover);
        border-color: var(--color-danger-item-hover);
        color: var(--color-danger-txt-item);
      }

      &:focus-visible::before {
        border-color: var(--color-danger-txt-base);
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

      &:hover {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-danger-txt-hover);
        color: var(--color-danger-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-danger-txt-base);
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

      &:hover {
        background-color: var(--color-danger-background-hover);
        border-color: var(--color-danger-background-hover);
        color: var(--color-danger-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-danger-txt-base);
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
    padding: 0.8rem;
    border-radius: 0.2rem;
  }

  &.size--medium {
    padding: 1.2rem 1.6rem;
    border-radius: 0.4rem;
  }
}
</style>
