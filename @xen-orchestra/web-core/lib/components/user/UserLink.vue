<!-- v1.0 -->
<template>
  <RouterLink v-if="route && !disabled" :to="route" class="user-link is-link typo p3-medium">
    <UserLogo class="logo" />
    {{ username }}
  </RouterLink>
  <span v-else :class="{ disabled }" class="user-link typo p3-medium">
    <UserLogo class="logo" />
    {{ username }}
  </span>
</template>

<script lang="ts" setup>
import UserLogo from '@core/components/user/UserLogo.vue'
import { type RouteLocationRaw } from 'vue-router'

defineProps<{
  route?: RouteLocationRaw
  disabled?: boolean
  username: string
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.user-link {
  --color: var(--color-normal-txt-base);
  --border-color: var(--color-normal-txt-base);

  &.is-link {
    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-normal-txt-hover);
      --border-color: var(--color-normal-txt-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-normal-txt-active);
      --border-color: var(--color-normal-txt-active);
    }
  }

  &.disabled {
    --color: var(--color-neutral-txt-secondary);
    --border-color: var(--color-neutral-txt-secondary);
  }
}

/* IMPLEMENTATION */
.user-link {
  display: inline-flex;
  align-items: center;
  color: var(--color);
  gap: 0.8rem;
  border-top: 1px solid transparent;
  border-bottom: 1px solid var(--border-color);
  line-height: 0;

  &.disabled {
    cursor: not-allowed;
  }

  &.is-link {
    text-decoration: none;
  }

  .logo {
    /* Override the default color of UserLogo,
     to apply hover, active and disabled styles */
    --border-color: inherit;
  }
}
</style>
