<!-- v3 -->
<template>
  <RouterLink v-if="route && !disabled" :to="route" class="ui-user-link is-link typo p3-regular-underline">
    <UiUserLogo size="extra-small" class="logo" />
    {{ username }}
  </RouterLink>
  <span v-else :class="toVariants({ disabled })" class="ui-user-link typo p3-regular-underline">
    <UiUserLogo size="extra-small" class="logo" />
    {{ username }}
  </span>
</template>

<script lang="ts" setup>
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { type RouteLocationRaw } from 'vue-router'

defineProps<{
  username: string
  route?: RouteLocationRaw
  disabled?: boolean
}>()
</script>

<style lang="postcss" scoped>
.ui-user-link {
  display: inline-flex;
  align-items: center;
  color: var(--color-info-txt-base);
  gap: 0.8rem;

  &.disabled {
    cursor: not-allowed;
  }

  /* INTERACTION VARIANTS */

  &.is-link {
    &:hover {
      color: var(--color-info-txt-hover);

      .logo {
        border-color: var(--color-info-txt-hover);
      }
    }

    &:active {
      color: var(--color-info-txt-active);

      .logo {
        border-color: var(--color-info-txt-active);
      }
    }

    &:focus-visible {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: -0.6rem;
        border: 0.2rem solid var(--color-info-txt-base);
        border-radius: 0.4rem;
      }
    }
  }

  &.disabled {
    color: var(--color-neutral-txt-secondary);

    .logo {
      border-color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
