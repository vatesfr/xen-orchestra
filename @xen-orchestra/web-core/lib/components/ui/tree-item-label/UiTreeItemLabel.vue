<!-- v2 -->
<template>
  <RouterLink v-slot="{ isExactActive, isActive, href, navigate }" :to="route" custom>
    <div
      :class="isExactActive ? 'exact-active' : active || isActive ? 'active' : undefined"
      class="ui-tree-item-label"
      v-bind="attrs"
    >
      <template v-if="depth > 1">
        <VtsTreeLine
          v-for="i in depth - 1"
          :key="i"
          :half-height="(!hasToggle && i === depth - 1) || !isExpanded"
          :right="i === depth - 1"
        />
      </template>
      <UiButtonIcon
        v-if="hasToggle"
        v-tooltip="isExpanded ? $t('core.close') : $t('core.open')"
        class="toggle"
        accent="info"
        :icon="isExpanded ? faAngleDown : faAngleRight"
        size="small"
        :target-scale="{ x: 1.5, y: 2 }"
        @click="emit('toggle')"
      />
      <div v-else class="h-line" />
      <a v-tooltip="{ selector: '.text' }" :href class="link typo p2-medium" @click="navigate">
        <slot name="icon">
          <VtsIcon :icon accent="current" class="icon" />
        </slot>
        <div class="text text-ellipsis">
          <slot />
        </div>
      </a>
      <slot name="addons" />
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN, IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { inject, ref, useAttrs } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  route: RouteLocationRaw
  icon?: IconDefinition
  active?: boolean
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

const hasToggle = inject(IK_TREE_ITEM_HAS_CHILDREN, ref(false))

const isExpanded = inject(IK_TREE_ITEM_EXPANDED, ref(true))

const depth = inject(IK_TREE_LIST_DEPTH, 0)
</script>

<style lang="postcss" scoped>
.ui-tree-item-label {
  display: flex;
  align-items: center;
  color: var(--color-neutral-txt-primary);
  background-color: var(--color-neutral-background-primary);
  border-radius: 0.8rem;
  gap: 0.4rem;
  padding: 0 0.8rem;
  margin-bottom: 0.2rem;

  .link {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    padding: 0.8rem 0;
    text-decoration: none;
    color: inherit;
    gap: 1.2rem;

    &:hover {
      color: var(--color-neutral-txt-primary);
    }
  }

  .text {
    padding-inline-end: 0.4rem;
  }

  .icon {
    font-size: 1.6rem;
  }

  .h-line {
    width: 2rem;
    border-bottom: 0.1rem solid var(--color-info-txt-base);
    margin-left: -0.4rem;
  }

  /* INTERACTION VARIANTS */

  &:is(.exact-active, .active) {
    background-color: var(--color-info-background-selected);
  }

  &:hover {
    background-color: var(--color-info-background-hover);
  }

  &:active {
    background-color: var(--color-info-background-active);
  }
}
</style>
