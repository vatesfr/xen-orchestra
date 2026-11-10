<template>
  <div class="vts-task-item-label" :class="{ selected }">
    <template v-if="depth > 1">
      <VtsTreeLine v-for="i in depth - 1" :key="i" size="small" />
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
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import {
  IK_TREE_ITEM_EXPANDED,
  IK_TREE_ITEM_HAS_CHILDREN,
  IK_TREE_LIST_DEPTH,
} from '@core/utils/injection-keys.util.ts'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { selected } = defineProps<{
  selected?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const hasToggle = inject(IK_TREE_ITEM_HAS_CHILDREN, ref(false))

const isExpanded = inject(IK_TREE_ITEM_EXPANDED, ref(true))

const depth = inject(IK_TREE_LIST_DEPTH, ref(0))
</script>

<style lang="postcss" scoped>
.vts-task-item-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 4.8rem;
  background-color: var(--color-neutral-background-primary);

  &.selected {
    background-color: var(--color-brand-background-selected);
  }

  .toggle-wrapper {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    width: 1.6rem;
  }

  .toggle,
  .h-line {
    width: 100%;
  }

  .content {
    display: flex;
    flex: 1;
    min-width: 0;
    align-self: stretch;
    border-block-end: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
