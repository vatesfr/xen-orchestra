import dagre from '@dagrejs/dagre'
import type { Ref } from 'vue'
import { computed } from 'vue'

import { NODE_DIMENSIONS, type TopologyEdge, type TopologyNode } from '../types/topology.types.ts'

export function useTopologyLayout(nodes: Ref<TopologyNode[]>, edges: Ref<TopologyEdge[]>) {
  return computed(() => {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
      rankdir: 'TB',
      nodesep: 60,
      ranksep: 80,
      marginx: 40,
      marginy: 40,
    })

    for (const node of nodes.value) {
      const dims = NODE_DIMENSIONS[node.data.type] ?? { width: 200, height: 100 }
      g.setNode(node.id, { width: dims.width, height: dims.height })
    }

    for (const edge of edges.value) {
      g.setEdge(edge.source, edge.target)
    }

    dagre.layout(g)

    const layoutedNodes: TopologyNode[] = nodes.value.map(node => {
      const graphNode = g.node(node.id)
      const dims = NODE_DIMENSIONS[node.data.type] ?? { width: 200, height: 100 }
      return {
        ...node,
        position: {
          x: graphNode.x - dims.width / 2,
          y: graphNode.y - dims.height / 2,
        },
      }
    })

    return { nodes: layoutedNodes, edges: edges.value }
  })
}
