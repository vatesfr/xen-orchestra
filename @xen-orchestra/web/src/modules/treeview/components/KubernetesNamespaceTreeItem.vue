<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      icon="object:namespace"
      :route="`/kubernetes/${encodeURIComponent(branch.id)}`"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name }}
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { KubernetesNamespaceBranch } from '@/modules/treeview/types/tree.type.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'

defineProps<{
  branch: KubernetesNamespaceBranch
}>()
</script>
