# Component example

Here is a fake `UiComponent.vue` component that uses most of the guidelines documented:

```vue
<!-- v4 -->
<template>
  <!-- Root class name matches the component's name -->
  <div class="ui-component" :class="classNames">
    <!-- Default slot-->
    <slot />

    <!-- Child component used only in this component-->
    <!-- Note the shorthand version for "icon" prop binding -->
    <SquareIcon :icon accent="current" class="icon" />

    <!-- Render the element only if the slot is used -->
    <div v-if="slots.info">
      <slot name="info" />
    </div>

    <!-- Slot + prop pattern -->
    <slot name="message">
      <p>{{ message }}</p>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import SquareIcon from '@core/components/ui/button/SquareIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type ButtonAccent = 'info' | 'success' // Export type, if used in another component
type ButtonVariant = 'primary' | 'secondary'
type ButtonSize = 'small' | 'medium' | 'large'

const {
  variant,
  accent,
  size,
  disabled,
  message = 'Default message',
} = defineProps<{
  // Props destructuring, with default value
  variant: ButtonVariant
  accent: ButtonAccent
  size: ButtonSize
  disabled?: boolean // Optional props are placed after the required ones
  message?: string
}>()

const slots = defineSlots<{
  default(): any // Required slot
  info?(): any // Optional slot
  message?(): any
}>()

const fontClasses = {
  small: 'typo p3-medium', // Typography classes, "typo" is required
  medium: 'typo h6-medium',
  large: 'typo h3-semi-bold',
}

const classNames = computed(() => [
  fontClasses[size], // Use the correct font size based on the size variant
  toVariants({ accent, variant, size, disabled }), // Use the "toVariants" utility to generate the correct CSS classes
])
</script>

<style lang="postcss" scoped>
.ui-component {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  vertical-align: middle;
  gap: 0.8rem;
  border-width: 0.1rem;
  outline: none;
  border-style: solid;

  /* Focus-visible utility */

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

  /* Child element selector if needed  */

  .icon {
    font-size: 0.8em;
  }

  /* Variants implementation */
  /* ACCENT + VARIANT */

  &.accent--info {
    &.variant--primary {
      background-color: var(--color-info-item-base);
      border-color: var(--color-info-item-base);
      color: var(--color-info-txt-item);

      &:hover {
        background-color: var(--color-info-item-hover);
        border-color: var(--color-info-item-hover);
        color: var(--color-info-txt-item);
      }

      &:focus-visible::before {
        border-color: var(--color-info-txt-base);
      }

      &:active {
        background-color: var(--color-info-item-active);
        border-color: var(--color-info-item-active);
        color: var(--color-info-txt-item);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-info-item-disabled);
        border-color: var(--color-info-item-disabled);
        color: var(--color-neutral-txt-secondary);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-info-item-base);
      color: var(--color-info-txt-base);

      &:hover {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-info-item-hover);
        color: var(--color-info-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-info-txt-base);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-info-item-active);
        color: var(--color-info-txt-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-txt-secondary);
        color: var(--color-neutral-txt-secondary);
      }
    }
  }

  &.accent--success {
    &.variant--primary {
      background-color: var(--color-success-item-base);
      border-color: var(--color-success-item-base);
      color: var(--color-success-txt-item);

      &:hover {
        background-color: var(--color-success-item-hover);
        border-color: var(--color-success-item-hover);
        color: var(--color-success-txt-item);
      }

      &:focus-visible::before {
        border-color: var(--color-success-txt-base);
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
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-success-txt-base);
      color: var(--color-success-txt-base);

      &:hover {
        background-color: var(--color-neutral-background-primary);
        border-color: var(--color-success-txt-hover);
        color: var(--color-success-txt-hover);
      }

      &:focus-visible::before {
        border-color: var(--color-success-txt-base);
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
}
</style>
```
