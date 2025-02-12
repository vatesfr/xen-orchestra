<!-- v3 -->
<template>
  <RouterLink v-if="route && !disabled" :to="route" class="ui-object-link is-link typo p3-regular-underline">
    <span class="icon">
      <slot name="icon">
        <VtsIcon :icon accent="current" />
      </slot>
    </span>
    <span v-tooltip class="content text-ellipsis">
      <slot />
    </span>
  </RouterLink>
  <span v-else :class="{ disabled }" class="ui-object-link typo p3-regular-underline">
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
  default(): any
  icon(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-object-link {
  display: flex;
  min-width: 0;
  align-items: center;
  color: var(--color-brand-txt-base);
  gap: 1rem;

  &.disabled {
    color: var(--color-neutral-txt-secondary);
    cursor: not-allowed;
  }

  .icon {
    color: var(--color-neutral-txt-primary);
    font-size: 0.8rem;
  }

  /* INTERACTION VARIANTS */

  &.is-link {
    &:hover {
      color: var(--color-brand-txt-hover);
    }

    &:active {
      color: var(--color-brand-txt-active);
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
}
</style>
