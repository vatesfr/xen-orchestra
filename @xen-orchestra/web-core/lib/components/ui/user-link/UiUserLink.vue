<!-- v2 -->
<!-- TODO: add focus interaction to bump to v3 -->
<template>
  <RouterLink v-if="route && !disabled" :to="route" class="ui-user-link is-link typo p3-regular-underline">
    <UiUserLogo size="extra-small" class="logo" />
    {{ username }}
  </RouterLink>
  <span v-else :class="toVariants({ muted: disabled })" class="ui-user-link typo p3-regular-underline">
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

  &.muted {
    cursor: not-allowed;
  }

  /* INTERACTION VARIANTS */

  &.is-link {
    &:is(:hover, :focus-visible) {
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
  }

  &.muted {
    color: var(--color-neutral-txt-secondary);

    .logo {
      border-color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
