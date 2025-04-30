<template>
  <VtsTreeItem :expanded="branch.isExpanded || !branch.isBranch">
    <UiTreeItemLabel class="tree-label" :route="`/task/${branch.data.id}`" @toggle="branch.toggleExpand()">
      <tr>
        <td :class="{ 'is-first': branch.depth === 0 }">{{ branch.label }}</td>
        <!--        <UiTaskItem :task="branch.data" :user="user" /> -->
      </tr>
    </UiTreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <VtsTreeList>
        <TaskTreeItem v-for="child in branch.rawChildren" :key="child.id" :branch="child" />
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { TaskBranch } from '@/types/tree.type.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { defineProps } from 'vue'

const { branch } = defineProps<{
  branch: TaskBranch
}>()
</script>

<style lang="postcss" scoped>
.tree-label {
  td {
    width: 100vw;
  }

  .is-first {
    border-top: 0;
  }
}

::v-deep(.ui-tree-item-label .link) {
  padding: 0 !important;
}
</style>
