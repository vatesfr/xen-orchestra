<!-- v3 -->
<template>
  <RouterLink v-slot="{ isExactActive, isActive, href, navigate }" :to="route" custom>
    <div
      :class="[className, isExactActive ? 'exact-active' : active || isActive ? 'active' : undefined]"
      class="ui-tree-item-label"
      v-bind="attrs"
    >
      <template v-if="depth > 1">
        <VtsTreeLine v-for="i in depth - 1" :key="i" :size="resolvedSize" />
      </template>
      <div class="toggle-wrapper">
        <UiButtonIcon
          v-if="hasToggle"
          v-tooltip="isExpanded ? t('action:close') : t('action:open')"
          :aria-label="isExpanded ? t('action:close') : t('action:open')"
          class="toggle"
          accent="brand"
          :icon="isExpanded ? 'fa:angle-down' : 'fa:angle-right'"
          size="small"
          :target-scale="{ x: 1.5, y: 2 }"
          @click.stop="emit('toggle')"
        />
        <div v-else class="h-line" />
      </div>
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
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { TREE_ITEM_SMALL_HEIGHT } from '@core/packages/tree/types.ts'
import {
  IK_TREE_ITEM_EXPANDED,
  IK_TREE_ITEM_HAS_CHILDREN,
  IK_TREE_ITEM_LABEL_SIZE,
  IK_TREE_LIST_DEPTH,
} from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, inject, ref, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

export type TreeItemLabelSize = 'small' | 'medium'

defineOptions({
  inheritAttrs: false,
})

const { size } = defineProps<{
  route: RouteLocationRaw
  icon?: IconName
  active?: boolean
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

const { t } = useI18n()

const attrs = useAttrs()

const hasToggle = inject(IK_TREE_ITEM_HAS_CHILDREN, ref(false))

const isExpanded = inject(IK_TREE_ITEM_EXPANDED, ref(true))

const depth = inject(IK_TREE_LIST_DEPTH, ref(0))

const contextSize = inject(IK_TREE_ITEM_LABEL_SIZE, undefined)

const resolvedSize = computed(() => size ?? contextSize ?? 'medium')

const className = computed(() => toVariants({ size: resolvedSize.value }))

const smallHeight = `${TREE_ITEM_SMALL_HEIGHT}px`
</script>

<style lang="postcss" scoped>
.ui-tree-item-label {
  display: flex;
  align-items: center;
  color: var(--color-neutral-txt-primary);
  background-color: var(--color-neutral-background-primary);
  gap: 0.4rem;
  padding: 0 0.8rem;

  .toggle-wrapper {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

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

  .toggle {
    width: 100%;
  }

  .h-line {
    width: 100%;
  }

  /* SIZE VARIANTS */

  &.size--small {
    height: v-bind(smallHeight);

    .toggle-wrapper {
      width: 1.6rem;
    }

    .link {
      gap: 0.8rem;
    }
  }

  &.size--medium {
    border-radius: 0.8rem;
    margin-bottom: 0.2rem;

    .toggle-wrapper {
      width: 2.4rem;
    }

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
