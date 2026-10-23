<!-- v9 -->
<template>
  <button :class="className" :disabled="isDisabled" class="ui-dropdown-button" type="button">
    <VtsIcon :name="icon" :size />
    <span :class="size === 'small' ? 'typo-action-button-small' : 'typo-action-button'">
      <slot />
    </span>
    <VtsIcon name="fa:angle-down" :size />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type DropdownButtonVariant = 'primary' | 'secondary'
export type DropdownButtonSize = 'small' | 'medium'

const { disabled, selected, size, variant } = defineProps<{
  variant: DropdownButtonVariant
  size: DropdownButtonSize
  disabled?: boolean
  selected?: boolean
  icon?: IconName
}>()

const isDisabled = useDisabled(() => disabled)

const className = computed(() => toVariants({ size, variant, selected }))
</script>

<style lang="postcss" scoped>
.ui-dropdown-button {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  position: relative;
  border-width: 0.1rem;
  border-style: solid;

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.5rem;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  /* VARIANT */
  &.variant--primary {
    background-color: var(--color-neutral-background-primary);
    border-color: var(--color-brand-item-base);
    border-radius: 9rem;
    color: var(--color-brand-txt-base);

    &:hover {
      border-color: var(--color-brand-item-hover);
      color: var(--color-brand-txt-hover);
    }

    &:active {
      border-color: var(--color-brand-item-active);
      color: var(--color-brand-txt-active);
    }

    &.selected:not(:disabled) {
      outline: 0.2rem solid var(--color-brand-item-base);
      color: var(--color-brand-txt-base);
    }

    &:disabled {
      cursor: not-allowed;
      background-color: var(--color-neutral-background-disabled);
      border-color: var(--color-neutral-txt-secondary);
      color: var(--color-neutral-txt-secondary);
    }
  }

  &.variant--secondary {
    background-color: transparent;
    border-color: transparent;
    color: var(--color-brand-txt-base);

    &:hover {
      background-color: var(--color-brand-background-hover);
      color: var(--color-brand-txt-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
      color: var(--color-brand-txt-active);
    }

    &.selected:not(:disabled) {
      background-color: var(--color-brand-background-selected);
      color: var(--color-brand-txt-base);
    }

    &:disabled {
      cursor: not-allowed;
      background-color: transparent;
      color: var(--color-neutral-txt-secondary);
    }
  }

  /* SIZE */
  &.size--small {
    padding-block: 0.8rem;
    padding-inline: 1.2rem;

    &.variant--secondary {
      border-radius: 0.2rem;
    }
  }

  &.size--medium {
    padding-block: 1.2rem;
    padding-inline: 1.6rem;

    &.variant--secondary {
      border-radius: 0.4rem;
    }
  }
}
</style>
