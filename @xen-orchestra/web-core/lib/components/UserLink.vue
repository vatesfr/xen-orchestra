<template>
  <RouterLink v-if="route" :class="{ disabled }" :to="route" class="user-link is-link typo p3-medium">
    <UserLogo class="logo" />
    <slot />
  </RouterLink>
  <span v-else :class="{ disabled }" class="user-link typo p3-medium">
    <UserLogo class="logo" />
    <slot />
  </span>
</template>

<script lang="ts" setup>
import UserLogo from '@core/components/UserLogo.vue'
import { type RouteLocationRaw } from 'vue-router'

defineProps<{
  route?: RouteLocationRaw
  disabled?: boolean
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.user-link {
  --color: var(--color-purple-base);
  --border-color: var(--color-purple-base);

  &.is-link {
    .logo {
      /* Override the default color of UserLogo,
       to apply hover, active and disabled styles */
      --border-color: inherit;
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-purple-d20);
      --border-color: var(--color-purple-d20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-purple-d40);
      --border-color: var(--color-purple-d40);
    }

    &:is(:disabled, .disabled) {
      --color: var(--color-grey-400);
      --border-color: var(--color-grey-400);
    }
  }
}

/* IMPLEMENTATION */
.user-link {
  display: inline-flex;
  align-items: center;
  color: var(--color);
  background-color: transparent;
  gap: 0.8rem;
  padding: 0;
  border-top: 1px solid transparent;
  border-bottom: 1px solid var(--border-color);
  line-height: 0;
  cursor: default;

  &.is-link {
    cursor: pointer;
    text-decoration: none;

    &.disabled {
      cursor: not-allowed;
    }
  }
}
</style>
