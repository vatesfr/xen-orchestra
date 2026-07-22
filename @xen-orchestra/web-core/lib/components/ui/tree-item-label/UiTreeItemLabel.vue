<!-- v3 -->
<template>
  <RouterLink v-slot="{ isExactActive, isActive, href, navigate }" :to="route" custom>
    <div
      :class="isExactActive ? 'exact-active' : active || isActive ? 'active' : undefined"
      class="ui-tree-item-label"
      v-bind="attrs"
    >
      <template v-if="depth > 1">
        <VtsTreeLine v-for="i in depth - 1" :key="i" />
      </template>
      <div class="toggle-wrapper">
        <UiButtonIcon
          v-if="hasToggle"
          v-tooltip="isExpanded ? t('action:close') : t('action:open')"
          class="toggle"
          accent="brand"
          :icon="isExpanded ? 'fa:angle-down' : 'fa:angle-right'"
          size="small"
          :target-scale="{ x: 1.5, y: 2 }"
          @click="emit('toggle')"
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
      <div class="addons-wrapper">
        <slot name="addons" />
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN, IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util'
import { inject, ref, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  route: RouteLocationRaw
  icon?: IconName
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

const { t } = useI18n()

const attrs = useAttrs()

const hasToggle = inject(IK_TREE_ITEM_HAS_CHILDREN, ref(false))

const isExpanded = inject(IK_TREE_ITEM_EXPANDED, ref(true))

const depth = inject(IK_TREE_LIST_DEPTH, ref(0))
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

  .toggle-wrapper {
    width: 2rem;
    flex-shrink: 0;
    margin-left: -0.4rem;
    display: flex;
    align-items: center;
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
      color: var(--color-neutral-txt-primary);
    }
  }

  .text {
    padding-inline-end: 0.4rem;
  }

  .icon {
    font-size: 1.6rem;
    width: 1.6rem;
    flex-shrink: 0;
    display: flex;
  }

  .addons-wrapper {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
    min-width: 7.5rem;
  }

  .toggle {
    width: 100%;
  }

  .h-line {
    width: 100%;
  }

  /* INTERACTION VARIANTS */

  &:is(.exact-active, .active) {
    background-color: var(--color-brand-background-selected);
  }

  &:hover {
    background-color: var(--color-brand-background-hover);
  }

  &:active {
    background-color: var(--color-brand-background-active);
  }
}
</style>
