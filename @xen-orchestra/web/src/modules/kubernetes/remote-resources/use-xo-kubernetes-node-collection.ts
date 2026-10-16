import type { XoKubernetesCluster, XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'
import { ref, watch } from 'vue'

type ApiKubernetesNode = Omit<XoKubernetesNode, 'id' | 'type'> & {
  id?: XoKubernetesNode['id']
}

function toXoNode(node: ApiKubernetesNode): XoKubernetesNode {
  return {
    ...node,
    id: node.id ?? node.node_id,
    type: 'kubernetes-node',
  }
}

/*
// Once API sends stable IDs:

type ApiKubernetesNode = Omit<XoKubernetesNode, 'type'>

function toXoNode(node: ApiKubernetesNode): XoKubernetesNode {
  return {
    ...node,
    type: 'kubernetes-node',
  }
}
*/

export const useXoKubernetesNodeCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/nodes`,
  initialData: () => [] as XoKubernetesNode[],
  onDataReceived: async (nodes, receivedData) => {
    nodes.value = (receivedData as ApiKubernetesNode[]).map(toXoNode)
  },
  state: (nodes, context) => {
    const sortedNodes = useSorted(nodes, (node1, node2) => node1.name.localeCompare(node2.name))

    function getNodeById(id: XoKubernetesNode['id'] | undefined) {
      if (id === undefined) {
        return undefined
      }

      return sortedNodes.value.find(node => node.id === id)
    }

    const nodesByCluster = ref(new Map<XoKubernetesCluster['id'], XoKubernetesNode[]>())

    watch(sortedNodes, nodeList => {
      const tmpNodesByCluster = new Map<XoKubernetesCluster['id'], XoKubernetesNode[]>()

      nodeList.forEach(node => {
        safePushInMap(tmpNodesByCluster, node.$cluster, node)
      })

      nodesByCluster.value = tmpNodesByCluster
    })

    return {
      nodes: sortedNodes,
      getNodeById,
      useGetNodeById: reactify(getNodeById),
      nodesByCluster,
      areNodesReady: context.isReady,
      hasNodesFetchError: context.hasError,
    }
  },
})
