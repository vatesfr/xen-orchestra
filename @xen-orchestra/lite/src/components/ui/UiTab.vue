<template>
  <component :is="tag" :class="{ active, disabled: disabled || isTabBarDisabled }" class="ui-tab">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { DisabledContext } from '@/context'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    active?: boolean
    tag?: string
  }>(),
  { tag: 'span', disabled: undefined }
)

const isTabBarDisabled = useContext(DisabledContext, () => props.disabled)
</script>

<style lang="postcss" scoped>
.ui-tab {
  font-size: 1.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  text-decoration: none;
  text-transform: uppercase;
  color: var(--color-grey-100);
  border-bottom: 2px solid transparent;

  &.disabled {
    pointer-events: none;
    color: var(--color-grey-500);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      cursor: pointer;
      border-bottom-color: var(--color-purple-base);
      background-color: var(--background-color-secondary);
    }

    &:active {
      color: var(--color-purple-base);
      border-bottom-color: var(--color-purple-base);
      background-color: var(--background-color-secondary);
    }

    &.active {
      color: var(--color-purple-base);
      border-bottom-color: var(--color-purple-base);
      background-color: var(--background-color-primary);
    }
  }
}
</style>
