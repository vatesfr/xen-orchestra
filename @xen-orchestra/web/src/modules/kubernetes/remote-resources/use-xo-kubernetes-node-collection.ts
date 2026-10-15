import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'

type ApiKubernetesNode = Omit<XoKubernetesNode, 'type'>

function toXoNode(node: ApiKubernetesNode): XoKubernetesNode {
  return {
    ...node,
    type: 'kubernetes-node',
  }
}

export const useXoKubernetesNodeCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/nodes`,
  initialData: () => [] as XoKubernetesNode[],
  onDataReceived: async (nodes, receivedData) => {
    nodes.value = (receivedData as ApiKubernetesNode[]).map(toXoNode)
  },
  state: (nodes, context) => {
    const sortedNodes = useSorted(nodes, (node1, node2) => node1.name.localeCompare(node2.name))

    function getNodeById(id: XoKubernetesNode['node_id'] | undefined) {
      if (id === undefined) {
        return undefined
      }

      return sortedNodes.value.find(node => node.node_id === id)
    }

    return {
      nodes: sortedNodes,
      getNodeById,
      useGetNodeById: reactify(getNodeById),
      areNodesReady: context.isReady,
      hasNodesFetchError: context.hasError,
    }
  },
})
