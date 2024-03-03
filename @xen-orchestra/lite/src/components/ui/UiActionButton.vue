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
    <UiIcon :busy :icon />
    <slot />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { useContext } from '@/composables/context.composable'
import { DisabledContext } from '@/context'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

const props = withDefaults(
  defineProps<{
    busy?: boolean
    disabled?: boolean
    icon?: IconDefinition
    active?: boolean
  }>(),
  { disabled: undefined }
)

const isDisabled = useContext(DisabledContext, () => props.disabled)
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
  background-color: var(--background-color-primary);

  &.disabled {
    color: var(--color-grey-500);
  }

  &:not(.disabled) {
    color: var(--color-grey-200);

    &:hover {
      background-color: var(--background-color-secondary);
    }

    &:active,
    &.active,
    &.busy {
      color: var(--color-purple-base);
      background-color: var(--background-color-purple-10);
    }
  }
}
</style>
