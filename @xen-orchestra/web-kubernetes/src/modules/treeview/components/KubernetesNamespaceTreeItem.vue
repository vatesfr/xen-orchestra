<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      icon="object:namespace"
      :route="getKubernetesNamespaceRoute(branch.data.id)"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name }}
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { KubernetesNamespaceBranch } from '@/modules/kubernetes/types/kubernetes-tree.type.ts'
import { getKubernetesNamespaceRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'

const { node: branch } = defineProps<{
  node: KubernetesNamespaceBranch
}>()
</script>
