<template>
  <KubernetesHeader />
  <VtsContentSidePanel class="kubernetes-nodes">
    <UiCard class="container">
      <NodesTable :nodes :busy="!areNodesReady" :error="hasNodesFetchError" />
    </UiCard>
    <NodeSidePanel :node="selectedNode" @close="selectedNode = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import KubernetesHeader from '@/modules/kubernetes/components/KubernetesHeader.vue'
import NodesTable from '@/modules/kubernetes/components/list/NodesTable.vue'
import NodeSidePanel from '@/modules/kubernetes/components/list/panel/NodeSidePanel.vue'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { nodes, areNodesReady, hasNodesFetchError, getNodeById } = useXoKubernetesNodeCollection()

const selectedNode = useRouteQuery<XoKubernetesNode | undefined>('id', {
  toData: id => getNodeById(id),
  toQuery: node => node?.node_id ?? '',
})
</script>

<style scoped lang="postcss">
.kubernetes-nodes {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
