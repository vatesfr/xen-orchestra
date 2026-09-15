import {
  kubernetesTreeClusters,
  kubernetesTreeNamespacesByCluster,
  kubernetesTreeNodesByCluster,
  kubernetesTreePodsByNamespace,
} from '@/modules/kubernetes/fixtures/kubernetes-tree.fixtures.ts'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type {
  FrontXoKubernetesNode,
  GroupedFrontXoKubernetesNode,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchRequest } from '@/shared/utils/fetch.util.ts'
import { logicAnd } from '@vueuse/math'
import { computed, ref, watch } from 'vue'

const useFixtures = import.meta.env.DEV && import.meta.env.VITE_K8S_TREE_USE_FIXTURES === 'true'

export function useXoKubernetesTreeData() {
  if (useFixtures) {
    return useXoKubernetesTreeFixtureData()
  }

  return useXoKubernetesTreeApiData()
}

function useXoKubernetesTreeFixtureData() {
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

function useXoKubernetesTreeApiData() {
  const { clusters, areClustersReady, hasClustersError } = useXoKubernetesClusterCollection()

  const nodesByCluster = ref(new Map<string, GroupedFrontXoKubernetesNode[]>())
  const areNodesReady = ref(false)
  const hasNodesError = ref(false)

  const namespacesByCluster = computed(() => kubernetesTreeNamespacesByCluster)

  const podsByNamespace = computed(() => kubernetesTreePodsByNamespace)

  watch(
    [clusters, areClustersReady],
    async ([clusterList, ready]) => {
      if (!ready) {
        areNodesReady.value = false
        return
      }

      areNodesReady.value = false
      hasNodesError.value = false

      if (clusterList.length === 0) {
        nodesByCluster.value = new Map()
        areNodesReady.value = true
        return
      }

      const map = new Map<string, GroupedFrontXoKubernetesNode[]>()
      let anyError = false

      const results = await Promise.allSettled(
        clusterList.map(async cluster => {
          const nodes = await fetchRequest<FrontXoKubernetesNode[]>(
            `kubernetes/clusters/${encodeURIComponent(cluster.name)}/nodes`
          )

          return { clusterName: cluster.name, nodes }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          map.set(
            result.value.clusterName,
            result.value.nodes.map(node => ({ ...node, $cluster: result.value.clusterName }))
          )
        } else {
          anyError = true
          console.warn('Failed to fetch kubernetes cluster nodes', result.reason)
        }
      }

      nodesByCluster.value = map
      hasNodesError.value = anyError
      areNodesReady.value = true
    },
    { immediate: true }
  )

  const areKubernetesObjectsReady = logicAnd(areClustersReady, areNodesReady)

  return {
    clusters,
    nodesByCluster,
    namespacesByCluster,
    podsByNamespace,
    areKubernetesObjectsReady,
    hasClustersError,
    hasNodesError,
  }
}
