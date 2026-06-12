<!-- v8 -->
<template>
  <button :class="[className, { selected }]" :disabled="isDisabled" class="ui-dropdown-item" type="button">
    <VtsIcon :name="icon" :size />
    <span :class="size === 'small' ? 'typo-action-button-small' : 'typo-action-button'">
      <slot />
    </span>
    <VtsIcon name="fa:angle-down" :size />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

const { disabled, selected, icon, size } = defineProps<{
  size: 'small' | 'medium'
  disabled?: boolean
  selected?: boolean
  icon?: IconName
}>()

const isDisabled = useDisabled(() => disabled)

const className = computed(() => toVariants({ size }))
</script>

<style lang="postcss" scoped>
.ui-dropdown-item {
  display: inline-flex;
  align-items: center;
  padding-block: 1.2rem;
  padding-inline: 1.6rem;
  gap: 0.8rem;
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-brand-item-base);
  border-radius: 9rem;
  cursor: pointer;
  position: relative;
  color: var(--color-brand-txt-base);

  &.size--small {
    padding-block: 0.8rem;
    padding-inline: 1.2rem;
  }

  &.size--medium {
    padding-block: 1.2rem;
    padding-inline: 1.6rem;
  }

  &:hover {
    border-color: var(--color-brand-item-hover);
    color: var(--color-brand-txt-hover);
  }

  &:active {
    border-color: var(--color-brand-item-active);
    color: var(--color-brand-txt-active);
  }

  &.selected:not(:disabled) {
    border: 0.2rem solid var(--color-brand-item-base);
    color: var(--color-brand-txt-base);
  }

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

  &:disabled {
    cursor: not-allowed;
    border-color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-disabled);
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
