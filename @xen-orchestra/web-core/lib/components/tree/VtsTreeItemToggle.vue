<template>
  <div :class="className" class="vts-tree-item-toggle">
    <template v-if="depth > 1">
      <VtsTreeLine v-for="i in depth - 1" :key="i" :size />
    </template>
    <div class="toggle-wrapper">
      <UiButtonIcon
        v-if="hasToggle"
        v-tooltip="toggleLabel"
        :aria-label="toggleLabel"
        class="toggle"
        accent="brand"
        :icon="isExpanded ? 'fa:angle-down' : 'fa:angle-right'"
        size="small"
        :target-scale="{ x: 1.5, y: 2 }"
        @click.stop="emit('toggle')"
      />
      <div v-else class="h-line" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { TreeItemLabelSize } from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import {
  IK_TREE_ITEM_EXPANDED,
  IK_TREE_ITEM_HAS_CHILDREN,
  IK_TREE_LIST_DEPTH,
} from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { size } = defineProps<{
  size: TreeItemLabelSize
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()

const hasToggle = inject(IK_TREE_ITEM_HAS_CHILDREN, ref(false))

const isExpanded = inject(IK_TREE_ITEM_EXPANDED, ref(true))

const depth = inject(IK_TREE_LIST_DEPTH, ref(0))

const toggleLabel = computed(() => (isExpanded.value ? t('action:close') : t('action:open')))

const className = computed(() => toVariants({ size }))
</script>

<style lang="postcss" scoped>
.vts-tree-item-toggle {
  display: contents;

  .toggle-wrapper {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .toggle,
  .h-line {
    width: 100%;
  }

  /* SIZE VARIANTS */

  &.size--small .toggle-wrapper {
    width: 1.6rem;
  }

  &.size--medium .toggle-wrapper {
    width: 2.4rem;
  }
}
</style>
