<template>
  <button
    v-tooltip="active ? false : { content: $t('account-organization-more'), placement: 'bottom-end' }"
    :class="{ disabled: isDisabled, active }"
    class="account-menu-trigger"
    type="button"
  >
    <UserLogo class="logo" size="medium" />
    <UiIcon :icon="faAngleDown" class="icon" color="info" />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import UserLogo from '@core/components/user/UserLogo.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  active?: boolean
}>()

const isDisabled = useContext(DisabledContext)
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.account-menu-trigger {
  --background-color: transparent;
  --accent-color: var(--color-normal-txt-base);

  &:is(:hover, .hover, :focus-visible) {
    --background-color: var(--color-normal-background-hover);
    --accent-color: var(--color-normal-txt-hover);
  }

  &:is(:active, .pressed) {
    --background-color: var(--color-normal-background-active);
    --accent-color: var(--color-normal-txt-active);
  }

  &.active {
    --background-color: var(--color-normal-background-selected);
    --accent-color: var(--color-normal-txt-base);
  }

  &.disabled {
    --background-color: transparent;
    --accent-color: var(--color-neutral-txt-secondary);
  }
}

/* IMPLEMENTATION */
.account-menu-trigger {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.4rem;
  border-color: transparent;
  padding: 0.4rem;
  outline: none;
  background-color: var(--background-color);

  &:not(.disabled) {
    cursor: pointer;
  }
}

.logo {
  border-color: var(--accent-color);
}

.icon {
  color: var(--accent-color);
}
</style>
