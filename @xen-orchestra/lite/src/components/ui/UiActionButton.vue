<template>
  <button
    :class="{
      busy: busy,
      disabled: isDisabled,
      active,
      'has-icon': icon !== undefined,
    }"
    :disabled="busy || isDisabled"
    class="ui-action-button"
    type="button"
  >
    <VtsIcon :busy :name="icon" size="medium" />
    <slot />
  </button>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'

const props = defineProps<{
  busy?: boolean
  disabled?: boolean
  icon?: IconName
  active?: boolean
}>()

const isDisabled = useDisabled(() => props.disabled)
</script>

<style lang="postcss" scoped>
.ui-action-button {
  font-size: 1.6rem;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 4.4rem;
  padding: 0 1.5rem;
  border: none;
  border-radius: 0.8rem;
  gap: 1rem;
  background-color: var(--color-neutral-background-primary);

  &.disabled {
    color: var(--color-neutral-border);
  }

  &:not(.disabled) {
    color: var(--color-neutral-txt-secondary);

    &:hover {
      background-color: var(--color-neutral-background-secondary);
    }

    &:active,
    &.active,
    &.busy {
      color: var(--color-brand-txt-base);
      background-color: var(--color-brand-background-selected);
    }
  }
}
</style>
