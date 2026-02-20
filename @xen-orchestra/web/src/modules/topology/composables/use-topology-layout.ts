import dagre from '@dagrejs/dagre'
import type { Ref } from 'vue'
import { computed } from 'vue'

import {
  NODE_DIMENSIONS,
  VM_GROUP_EXPANDED_ROW_HEIGHT,
  type TopologyEdge,
  type TopologyNode,
} from '../types/topology.types.ts'

function getNodeDimensions(node: TopologyNode) {
  const data = node.data!
  if (data.type === 'vm-group' && data.isExpanded) {
    const base = NODE_DIMENSIONS['vm-group']
    return { width: base.width, height: base.height + data.vms.length * VM_GROUP_EXPANDED_ROW_HEIGHT }
  }
  return NODE_DIMENSIONS[data.type] ?? { width: 200, height: 100 }
}

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
      const dims = getNodeDimensions(node)
      g.setNode(node.id, { width: dims.width, height: dims.height })
    }

    for (const edge of edges.value) {
      g.setEdge(edge.source, edge.target)
    }

    dagre.layout(g)

    const layoutedNodes: TopologyNode[] = nodes.value.map(node => {
      const graphNode = g.node(node.id)
      const dims = getNodeDimensions(node)
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
