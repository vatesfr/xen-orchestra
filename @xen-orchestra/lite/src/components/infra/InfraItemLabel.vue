<template>
  <RouterLink v-slot="{ isExactActive, href, navigate }" :to="route" custom>
    <div
      :class="isExactActive ? 'exact-active' : $props.active ? 'active' : undefined"
      class="infra-item-label"
      v-bind="$attrs"
    >
      <a v-tooltip="{ selector: '.text-ellipsis' }" :href class="link" @click="navigate">
        <UiIcon :icon class="icon" />
        <div class="text-ellipsis typo h6-medium">
          <slot />
        </div>
      </a>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import type { RouteLocationRaw } from 'vue-router'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  icon: IconDefinition
  route: RouteLocationRaw
  active?: boolean
}>()
</script>

<style lang="postcss" scoped>
.infra-item-label {
  display: flex;
  align-items: stretch;
  color: var(--color-neutral-txt-primary);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);

  &:hover {
    color: var(--color-neutral-txt-primary);
    background-color: var(--color-neutral-background-secondary);
  }

  &:active,
  &.active {
    color: var(--color-info-txt-base);
    background-color: var(--color-neutral-background-primary);
  }

  &.exact-active {
    color: var(--color-neutral-txt-primary);
    background-color: var(--color-info-background-selected);

    .icon {
      color: var(--color-info-txt-base);
    }
  }
}

.link {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  gap: 1rem;
  font-weight: 500;
  font-size: 2rem;
}

.actions {
  display: flex;
  align-items: center;
}
</style>
