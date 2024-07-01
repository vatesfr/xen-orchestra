<!-- v1.0 -->
<template>
  <RouterLink v-if="route && !disabled" :to="route" class="object-link is-link typo p3-medium">
    <span class="icon">
      <slot name="icon">
        <UiIcon :icon />
      </slot>
    </span>
    <slot />
  </RouterLink>
  <span v-else :class="{ disabled }" class="object-link typo p3-medium">
    <span class="icon">
      <slot name="icon">
        <UiIcon :icon />
      </slot>
    </span>
    <slot />
  </span>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { type RouteLocationRaw } from 'vue-router'

defineProps<{
  route?: RouteLocationRaw
  disabled?: boolean
  icon?: IconDefinition
}>()

defineSlots<{
  default: () => any
  icon: () => any
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.object-link {
  --color: var(--color-purple-base);
  --border-color: var(--color-purple-base);

  &.is-link {
    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-purple-d20);
      --border-color: var(--color-purple-d20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-purple-d40);
      --border-color: var(--color-purple-d40);
    }
  }

  &.disabled {
    --color: var(--color-grey-400);
    --border-color: var(--color-grey-400);
  }
}

/* IMPLEMENTATION */
.object-link {
  display: inline-flex;
  align-items: center;
  color: var(--color);
  gap: 0.8rem;
  border-top: 1px solid transparent;
  border-bottom: 1px solid var(--border-color);
  line-height: 0;
  padding-block: 0.5rem;

  &.disabled {
    cursor: not-allowed;
  }

  &.is-link {
    text-decoration: none;
  }
}

.icon {
  color: var(--color-grey-100);
  font-size: 0.8rem;
}
</style>
