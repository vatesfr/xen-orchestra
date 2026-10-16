<template>
  <VtsContentSidePanel class="nodes">
    <UiCard class="container">
      <NodesTable :nodes :busy="!areNodesReady" :error="hasNodesFetchError" />
    </UiCard>
    <NodeSidePanel :node="selectedNode" @close="selectedNode = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import NodesTable from '@/modules/kubernetes/components/list/NodesTable.vue'
import NodeSidePanel from '@/modules/kubernetes/components/list/panel/NodeSidePanel.vue'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesCluster, XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { areNodesReady, hasNodesFetchError, nodesByCluster } = useXoKubernetesNodeCollection()

const nodes = computed(() => nodesByCluster.value.get(cluster.id) ?? [])

const selectedNode = useRouteQuery<XoKubernetesNode | undefined>('id', {
  toData: id => nodes.value.find(node => node.id === id),
  toQuery: node => node?.id ?? '',
})
</script>

<style scoped lang="postcss">
.nodes {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
