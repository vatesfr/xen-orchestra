<!-- v5 -->
<template>
  <button :class="{ selected }" :disabled="isDisabled" class="ui-dropdown-item" type="button">
    <VtsIcon :icon accent="current" class="left-icon" fixed-width />
    <span class="typo p1-regular label">
      <slot />
    </span>
    <VtsIcon :icon="faAngleDown" accent="current" class="right-icon" fixed-width />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

const { disabled, selected, icon } = defineProps<{
  disabled?: boolean
  selected?: boolean
  icon?: IconDefinition
}>()

const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-dropdown-item {
  display: inline-flex;
  align-items: center;
  padding-block: 1.2rem;
  padding-inline: 1.6rem;
  gap: 0.8rem;
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-brand-txt-base);
  border-radius: 9rem;
  cursor: pointer;
  position: relative;
  color: var(--color-brand-txt-base);

  &:hover {
    border-color: var(--color-brand-txt-hover);
    background-color: var(--color-brand-background-hover);
    color: var(--color-brand-txt-hover);
  }

  &:active {
    border-color: var(--color-brand-txt-active);
    background-color: var(--color-brand-background-active);
    color: var(--color-brand-txt-active);
  }

  &.selected:not(:disabled) {
    background-color: var(--color-brand-background-selected);
    outline: 0.1rem solid var(--color-brand-txt-base);
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
