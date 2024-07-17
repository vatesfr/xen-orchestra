<!-- v1.1 -->
<template>
  <RouterLink v-slot="{ isExactActive, href, navigate }" :to="route" custom>
    <div
      :class="isExactActive ? 'exact-active' : active ? 'active' : undefined"
      class="tree-item-label"
      v-bind="$attrs"
    >
      <template v-if="depth > 1">
        <TreeLine
          v-for="i in depth - 1"
          :key="i"
          :half-height="(!hasToggle && i === depth - 1) || !isExpanded"
          :right="i === depth - 1"
        />
      </template>
      <ButtonIcon
        v-if="hasToggle"
        v-tooltip="isExpanded ? $t('core.close') : $t('core.open')"
        class="toggle"
        :icon="isExpanded ? faAngleDown : faAngleRight"
        size="small"
        @click="emit('toggle')"
      />
      <TreeLine v-else-if="!noIndent" />
      <a v-tooltip="{ selector: '.text' }" :href class="link typo p2-medium" @click="navigate">
        <slot name="icon">
          <UiIcon :icon class="icon" />
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
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeLine from '@core/components/tree/TreeLine.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN, IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { inject, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  icon?: IconDefinition
  route: RouteLocationRaw
  active?: boolean
  noIndent?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const hasToggle = inject(IK_TREE_ITEM_HAS_CHILDREN, ref(false))

const isExpanded = inject(IK_TREE_ITEM_EXPANDED, ref(true))

const depth = inject(IK_TREE_LIST_DEPTH, 0)
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.tree-item-label {
  --color: var(--color-grey-100);
  --background-color: var(--background-color-primary);

  &:is(.exact-active, .active) {
    --color: var(--color-grey-100);
    --background-color: var(--background-color-purple-10);
  }

  &:hover {
    --color: var(--color-grey-100);
    --background-color: var(--background-color-purple-20);
  }

  &:active {
    --color: var(--color-grey-100);
    --background-color: var(--background-color-purple-30);
  }
}

/* IMPLEMENTATION */
.tree-item-label {
  display: flex;
  align-items: center;
  color: var(--color);
  background-color: var(--background-color);
  border-radius: 0.8rem;
  gap: 0.4rem;
  padding: 0 0.8rem;
  margin-bottom: 0.2rem;
}

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
    color: var(--color-grey-100);
  }
}

.text {
  padding-inline-end: 0.4rem;
}

.icon {
  font-size: 1.6rem;
}

/*
 * Increase the size of the clickable area,
 * without changing the padding of the ButtonIcon component
 */
.toggle::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: scale(1.5, 2);
}
</style>
