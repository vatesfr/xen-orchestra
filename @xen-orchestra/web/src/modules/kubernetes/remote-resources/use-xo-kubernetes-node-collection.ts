import { useWatchKubernetesCollection } from '@/modules/kubernetes/composables/use-watch-kubernetes-collection.composable.ts'
import type { XoKubernetesCluster, XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'
import { ref, watch } from 'vue'

type ApiKubernetesNode = Omit<XoKubernetesNode, 'type'>

function toXoNode(node: ApiKubernetesNode): XoKubernetesNode {
  return {
    ...node,
    type: 'kubernetes-node',
  }
}

export const useXoKubernetesNodeCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/nodes`,
  initWatchCollection: () => useWatchKubernetesCollection('kubernetes-node'),
  initialData: () => [] as ApiKubernetesNode[],
  state: (rawNodes, context) => {
    const sortedRawNodes = useSorted(rawNodes, (node1, node2) => node1.name.localeCompare(node2.name))

    const nodes = ref<XoKubernetesNode[]>([])
    const nodesByCluster = ref(new Map<XoKubernetesCluster['id'], XoKubernetesNode[]>())

    watch(sortedRawNodes, _nodes => {
      const tmpNodes: XoKubernetesNode[] = []
      const tmpNodesByCluster = new Map<XoKubernetesCluster['id'], XoKubernetesNode[]>()

      _nodes.forEach(rawNode => {
        const node = toXoNode(rawNode)

        tmpNodes.push(node)
        safePushInMap(tmpNodesByCluster, node.$cluster, node)
      })

      nodes.value = tmpNodes
      nodesByCluster.value = tmpNodesByCluster
    })

    function getNodeById(id: XoKubernetesNode['id'] | undefined) {
      if (id === undefined) {
        return undefined
      }

      return nodes.value.find(node => node.id === id)
    }

    return {
      nodes,
      getNodeById,
      useGetNodeById: reactify(getNodeById),
      nodesByCluster,
      areNodesReady: context.isReady,
      hasNodesFetchError: context.hasError,
    }
  },
})
