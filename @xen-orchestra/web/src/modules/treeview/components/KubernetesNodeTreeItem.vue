<template>
  <VtsTreeItem expanded :node-id="leaf.id">
    <UiTreeItemLabel icon="object:node" :route="`/kubernetes/${encodeURIComponent(leaf.id)}`" no-indent>
      {{ leaf.data.name }}
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { KubernetesNodeLeaf } from '@/modules/treeview/types/tree.type.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'

defineProps<{
  leaf: KubernetesNodeLeaf
}>()
</script>
