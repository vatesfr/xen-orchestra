<!-- v3 -->
<template>
  <RouterLink v-slot="{ isExactActive, isActive, href, navigate }" :to="route" custom>
    <div :class="[className, getActiveClass(isExactActive, isActive)]" class="ui-tree-item-label" v-bind="attrs">
      <VtsTreeItemToggle :size="resolvedSize" @toggle="emit('toggle')" />
      <a :href class="link typo-body-bold-small" @click="navigate">
        <slot name="icon">
          <VtsIcon :name="icon" size="medium" class="icon" />
        </slot>
        <div v-tooltip class="text text-ellipsis">
          <slot />
        </div>
      </a>
      <div class="addons-wrapper" @click.stop>
        <slot name="addons" />
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItemToggle from '@core/components/tree/VtsTreeItemToggle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { TREE_ITEM_SMALL_HEIGHT } from '@core/packages/tree/types.ts'
import { IK_TREE_ITEM_LABEL_SIZE } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, inject, useAttrs } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export type TreeItemLabelSize = 'small' | 'medium'

defineOptions({
  inheritAttrs: false,
})

const {
  size,
  active,
  exactActive = undefined,
} = defineProps<{
  route: RouteLocationRaw
  icon?: IconName
  active?: boolean
  /**
   * Replaces the exact-active state of the link when set, which then decides
   * alone (no `active` either): e.g. for routes differing only by their query,
   * which `RouterLink` ignores
   */
  exactActive?: boolean
  size?: TreeItemLabelSize
}>()

const emit = defineEmits<{
  toggle: []
}>()

defineSlots<{
  default(): any
  icon?(): any
  addons?(): any
}>()

const attrs = useAttrs()

const contextSize = inject(IK_TREE_ITEM_LABEL_SIZE, undefined)

const resolvedSize = computed(() => size ?? contextSize ?? 'medium')

const className = computed(() => toVariants({ size: resolvedSize.value }))

const smallHeight = `${TREE_ITEM_SMALL_HEIGHT}px`

function getActiveClass(isExactActive: boolean, isActive: boolean) {
  if (exactActive !== undefined) {
    return exactActive ? 'exact-active' : undefined
  }

  return isExactActive ? 'exact-active' : active || isActive ? 'active' : undefined
}
</script>

<style lang="postcss" scoped>
.ui-tree-item-label {
  display: flex;
  align-items: center;
  color: var(--color-neutral-txt-primary);
  background-color: var(--color-neutral-background-primary);
  gap: 0.4rem;
  padding: 0 0.8rem;

  .link {
    display: flex;
    align-items: center;
    flex: 1;
    align-self: stretch;
    min-width: 0;
    text-decoration: none;
    color: inherit;

    &:hover {
      color: var(--color-neutral-txt-primary);
    }
  }

  .icon {
    font-size: 1.6rem;
  }
  .addons-wrapper {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  /* SIZE VARIANTS */

  &.size--small {
    height: v-bind(smallHeight);

    .link {
      gap: 0.8rem;
    }
  }

  &.size--medium {
    border-radius: 0.8rem;
    margin-bottom: 0.2rem;

    .link {
      padding: 0.8rem 0;
      gap: 1.2rem;
    }

    .text {
      padding-inline-end: 0.4rem;
    }
  }

  /* INTERACTION VARIANTS */

  &:is(.exact-active, .active) {
    background-color: var(--color-brand-background-selected);
  }

  &:hover:not(:has(.addons-wrapper :is(button, a):hover)) {
    background-color: var(--color-brand-background-hover);
  }

  &:active:not(:has(.addons-wrapper :is(button, a):active)) {
    background-color: var(--color-brand-background-active);
  }
}
</style>
