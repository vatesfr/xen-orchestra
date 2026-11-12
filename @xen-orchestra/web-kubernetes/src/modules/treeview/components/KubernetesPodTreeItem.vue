<template>
  <VtsTreeItem expanded :node-id="leaf.id">
    <UiTreeItemLabel icon="object:pod" :route="getKubernetesPodRoute(leaf.data.id)" no-indent>
      {{ leaf.data.name }}
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { KubernetesPodLeaf } from '@/modules/kubernetes/types/kubernetes-tree.type.ts'
import { getKubernetesPodRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'

const { node: leaf } = defineProps<{
  node: KubernetesPodLeaf
}>()
</script>
