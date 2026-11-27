<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.data.id" :has-children="branch.hasChildren">
    <div class="group-tree-item" @click.stop="branch.toggleCollapse()">
      <VtsTreeItemToggle size="small" @toggle="branch.toggleCollapse()" />
      <div class="label typo-body-regular-small">
        <VtsIcon :name="branch.data.icon" size="medium" />
        <div v-tooltip class="text-ellipsis">{{ branch.data.label }}</div>
      </div>
    </div>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { GroupBranch } from '@/modules/treeview/types/tree.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeItemToggle from '@core/components/tree/VtsTreeItemToggle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { TREE_ITEM_SMALL_HEIGHT } from '@core/packages/tree/types.ts'

defineProps<{
  branch: GroupBranch
}>()

const height = `${TREE_ITEM_SMALL_HEIGHT}px`
</script>

<style lang="postcss" scoped>
.group-tree-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  height: v-bind(height);
  padding: 0 0.8rem;
  color: var(--color-neutral-txt-secondary);
  background-color: var(--color-neutral-background-primary);
  cursor: pointer;

  &:hover {
    background-color: var(--color-brand-background-hover);
  }

  .label {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 0.8rem;
    min-width: 0;
  }
}
</style>
