<!-- v1.0 -->
<template>
  <RouterLink v-if="route && !disabled" :to="route" class="object-link is-link typo p3-medium">
    <span class="icon">
      <slot name="icon">
        <VtsIcon :icon accent="current" />
      </slot>
    </span>
    <span v-tooltip class="content text-ellipsis">
      <slot />
    </span>
  </RouterLink>
  <span v-else :class="{ disabled }" class="object-link typo p3-medium">
    <span class="icon">
      <slot name="icon">
        <VtsIcon :icon accent="current" />
      </slot>
    </span>
    <slot />
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
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
  --color: var(--color-info-txt-base);
  --border-color: var(--color-info-txt-base);

  &.is-link {
    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-info-txt-hover);
      --border-color: var(--color-info-txt-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-info-txt-active);
      --border-color: var(--color-info-txt-active);
    }
  }

  &.disabled {
    --color: var(--color-neutral-txt-secondary);
    --border-color: var(--color-neutral-txt-secondary);
  }
}

/* IMPLEMENTATION */
.object-link {
  display: flex;
  min-width: 0;
  align-items: center;
  color: var(--color);
  gap: 1rem;
  border-top: 0.1rem solid transparent;
  border-bottom: 0.1rem solid var(--border-color);
  line-height: 1;
  padding-block: 0.5rem;
  text-decoration: none;

  &.disabled {
    cursor: not-allowed;
  }
}

.icon {
  color: var(--color-neutral-txt-primary);
  font-size: 0.8rem;
}
</style>
