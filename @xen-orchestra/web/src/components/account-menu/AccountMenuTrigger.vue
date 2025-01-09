<template>
  <button
    v-tooltip="selected ? false : { content: $t('account-organization-more'), placement: 'bottom-end' }"
    :class="{ disabled: isDisabled, selected }"
    class="account-menu-trigger"
    type="button"
  >
    <UiUserLogo class="logo" size="medium" />
    <VtsIcon :icon="faAngleDown" class="icon" accent="info" />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  selected?: boolean
}>()

const isDisabled = useContext(DisabledContext)
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.account-menu-trigger {
  --background-color: transparent;
  --accent-color: var(--color-info-txt-base);

  &:is(:hover, .hover, :focus-visible) {
    --background-color: var(--color-info-background-hover);
    --accent-color: var(--color-info-txt-hover);
  }

  &:is(:active, .pressed) {
    --background-color: var(--color-info-background-active);
    --accent-color: var(--color-info-txt-active);
  }

  &.selected {
    --background-color: var(--color-info-background-selected);
    --accent-color: var(--color-info-txt-base);
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
