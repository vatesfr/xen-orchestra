<!-- v1.0 -->
<template>
  <component
    :is="as"
    v-tooltip="tooltip ?? false"
    :class="{ selected, disabled }"
    class="vts-menu-trigger typo p2-medium"
  >
    <VtsIcon :busy :icon accent="current" />
    <slot />
    <VtsIcon v-if="submenu" :fixed-width="false" :icon="submenuIcon" accent="current" class="submenu-icon" />
  </component>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { type TooltipDirectiveContent, vTooltip } from '@core/directives/tooltip.directive'
import { IK_MENU_HORIZONTAL } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { type Component, computed, inject } from 'vue'

export type MenuTriggerProps = {
  as: string | Component
  tooltip?: TooltipDirectiveContent
  selected?: boolean
  busy?: boolean
  disabled?: boolean
  icon?: IconDefinition
  submenu?: boolean
}

defineProps<MenuTriggerProps>()

defineSlots<{
  default(): any
}>()

const isParentHorizontal = inject(IK_MENU_HORIZONTAL, undefined)

const submenuIcon = computed(() => (isParentHorizontal?.value ? faAngleDown : faAngleRight))
</script>

<style lang="postcss" scoped>
.vts-menu-trigger {
  display: flex;
  width: 100%;
  align-items: center;
  height: 4.4rem;
  padding-right: 1.5rem;
  padding-left: 1.5rem;
  white-space: nowrap;
  border-radius: 0.8rem;
  gap: 1rem;
  color: var(--color-neutral-txt-primary);
  background-color: var(--color-neutral-background-primary);
  border: none;
  text-decoration: none;

  &.disabled {
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      color: var(--color-neutral-txt-primary);
      background-color: var(--color-info-background-selected);
    }

    &:active,
    &.selected {
      color: var(--color-neutral-txt-primary);
      background-color: var(--color-info-background-hover);
    }
  }

  .submenu-icon {
    margin-left: auto;
  }
}
</style>
