<template>
  <button
    v-tooltip="{ content: $t('account-organization-more'), placement: 'bottom-end' }"
    :class="{ disabled: isDisabled, active }"
    class="account-menu"
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
.account-menu {
  --background-color: transparent;

  .logo {
    --border-color: var(--color-purple-base);
  }

  .icon {
    --color: var(--color-purple-base);
  }

  &:is(:hover, .hover, :focus-visible) {
    --background-color: var(--background-color-purple-20);

    .logo {
      --border-color: var(--color-purple-d20);
    }

    .icon {
      --color: var(--color-purple-d20);
    }
  }

  &:is(:active, .pressed) {
    --background-color: var(--background-color-purple-30);

    .logo {
      --border-color: var(--color-purple-d40);
    }

    .icon {
      --color: var(--color-purple-d40);
    }
  }

  &.active {
    --background-color: var(--background-color-purple-10);

    .logo {
      --border-color: var(--color-purple-base);
    }

    .icon {
      --color: var(--color-purple-base);
    }
  }

  &.disabled {
    --background-color: transparent;

    .logo {
      --border-color: var(--color-grey-400);
    }

    .icon {
      --color: var(--color-grey-400);
    }
  }
}

/* IMPLEMENTATION */
.account-menu {
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

  .logo {
    border-color: var(--border-color);
  }

  .icon {
    color: var(--color);
  }
}
</style>
