<!-- v3 -->
<template>
  <button type="button" class="ui-dropdown-item" :class="{ selected }" :disabled="isDisabled">
    <VtsIcon :icon="leftIcon" accent="current" class="left-icon" fixed-width />
    <span class="typo p1-regular label">
      <slot />
    </span>
    <VtsIcon :icon="faAngleDown" accent="current" class="right-icon" fixed-width />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    selected?: boolean
    leftIcon?: IconDefinition
  }>(),
  { disabled: undefined }
)

const isDisabled = useContext(DisabledContext, () => props.disabled)
</script>

<style scoped lang="postcss">
.ui-dropdown-item {
  display: inline-flex;
  align-items: center;
  padding-block: 0.4rem;
  padding-inline: 1.6rem;
  gap: 0.8rem;
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-normal-txt-base);
  border-radius: 9rem;
  cursor: pointer;
  position: relative;

  .label,
  .right-icon,
  .left-icon {
    color: var(--color-normal-txt-base);
  }

  &:hover {
    border-color: var(--color-normal-txt-hover);
    background-color: var(--color-normal-background-hover);

    .label,
    .right-icon,
    .left-icon {
      color: var(--color-normal-txt-hover);
    }
  }

  &:active {
    border-color: var(--color-normal-txt-active);
    background-color: var(--color-normal-background-active);

    .label,
    .right-icon,
    .left-icon {
      color: var(--color-normal-txt-active);
    }
  }

  &.selected:not(:disabled) {
    border: 0.2rem solid var(--color-normal-txt-base);
    background-color: var(--color-normal-background-selected);
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.5rem;
      border: 0.2rem solid var(--color-normal-txt-base);
      border-radius: 0.4rem;
    }
  }

  &:disabled {
    cursor: not-allowed;
    border-color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-disabled);

    .label,
    .right-icon,
    .left-icon {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
