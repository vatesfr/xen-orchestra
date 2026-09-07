import {
  kubernetesTreeClusters,
  kubernetesTreeNamespacesByCluster,
  kubernetesTreeNodesByCluster,
  kubernetesTreePodsByNamespace,
} from '@/modules/kubernetes/fixtures/kubernetes-tree.fixtures.ts'
import { computed } from 'vue'

export function useXoKubernetesTreeData() {
  const clusters = computed(() => kubernetesTreeClusters)

  const nodesByCluster = computed(() => kubernetesTreeNodesByCluster)

  const namespacesByCluster = computed(() => kubernetesTreeNamespacesByCluster)

  const podsByNamespace = computed(() => kubernetesTreePodsByNamespace)

  const areKubernetesObjectsReady = computed(() => true)

  return {
    clusters,
    nodesByCluster,
    namespacesByCluster,
    podsByNamespace,
    areKubernetesObjectsReady,
  }
}
