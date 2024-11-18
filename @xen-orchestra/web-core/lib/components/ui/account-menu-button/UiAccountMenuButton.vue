<!-- v2 -->
<template>
  <button :class="{ disabled: isDisabled, selected }" class="ui-account-menu-button" type="button">
    <UiUserLogo class="logo" :size />
  </button>
</template>

<script lang="ts" setup>
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'

defineProps<{
  size: 'small' | 'medium'
  selected?: boolean
}>()

const isDisabled = useContext(DisabledContext)
</script>

<style lang="postcss" scoped>
.ui-account-menu-button {
  padding: 0.4rem;
  border-radius: 0.4rem;
  border-color: transparent;
  background-color: transparent;

  &:not(.disabled) {
    cursor: pointer;
  }

  &:hover {
    background-color: var(--color-info-background-hover);
  }

  &:active {
    background-color: var(--color-info-background-active);
  }

  &.selected {
    background-color: var(--color-info-background-selected);
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.4rem;
      border: 0.2rem solid var(--color-info-txt-base);
      border-radius: 0.4rem;
    }
  }

  &.disabled {
    background-color: transparent;

    .logo {
      border-color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
