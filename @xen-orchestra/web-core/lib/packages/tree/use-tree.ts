import { buildNodes } from '@core/packages/tree/build-nodes'
import type {
  DefinitionToTreeNode,
  FlatTreeNode,
  TreeContext,
  TreeNode,
  TreeNodeDefinition,
  TreeNodeId,
  UseTreeOptions,
} from '@core/packages/tree/types'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'

export function useTree<
  TDefinition extends TreeNodeDefinition,
  TTreeNode extends DefinitionToTreeNode<TDefinition> = DefinitionToTreeNode<TDefinition>,
>(definitions: MaybeRefOrGetter<TDefinition[]>, options: UseTreeOptions = {}) {
  const selectedIds = ref(new Set<TreeNodeId>())
  const collapsedIds = options.collapsedIds ?? ref(new Set<TreeNodeId>())
  const activeId = ref<TreeNodeId>()

  const context = reactive({
    allowMultiSelect: options.allowMultiSelect ?? false,
    selectedIds,
    collapsedIds,
    activeId,
  }) as TreeContext

  const nodes = computed(() => {
    const nodes = buildNodes<TDefinition, TTreeNode>(toValue(definitions), context)

    if (options.collapse) {
      nodes.forEach(node => node.isBranch && node.toggleCollapse(false, true))
    }

    return nodes
  })

  const nodesMap = computed(() => {
    const nodeMap = new Map<TreeNodeId, TreeNode>()

    function traverse(node: TreeNode) {
      nodeMap.set(node.id, node)

      if (node.isBranch) {
        node.rawChildren.forEach(traverse)
      }
    }

    nodes.value.forEach(traverse)

    return nodeMap
  })

  const visibleNodes = computed(() => nodes.value.filter(node => !node.isExcluded))

  const flatNodes = computed<FlatTreeNode[]>(() => {
    const result: FlatTreeNode[] = []

    const flatten = (list: TreeNode[]) => {
      for (const node of list) {
        result.push({ id: node.id, node, depth: node.depth })
        if (node.isBranch && !node.isCollapsed) {
          flatten(node.children)
        }
      }
    }

    flatten(visibleNodes.value)

    return result
  })

  // Index of each flat node by its id, to look up a row position in O(1)
  // (e.g. to scroll a virtual list to a given node) instead of scanning.
  const flatNodeIndexById = computed(() => {
    const index = new Map<TreeNodeId, number>()
    const list = flatNodes.value
    for (let i = 0; i < list.length; i++) {
      index.set(list[i].id, i)
    }
    return index
  })

  const getNode = (id: TreeNodeId | undefined) => (id !== undefined ? nodesMap.value.get(id) : undefined)
  const getNodes = (ids: TreeNodeId[]) => ids.map(getNode).filter(node => node !== undefined) as TreeNode[]

  const getHierarchy = (node: TreeNode | undefined) => {
    const path: TreeNode[] = []
    while (node) {
      path.unshift(node)
      node = node.parent
    }
    return path
  }

  function findNodeByObjectId(nodes: TreeNode[], objectId: string | number): TreeNode | undefined {
    for (const node of nodes) {
      if (node && node.data && (node.data.id === objectId || String(node.data.id) === String(objectId))) {
        return node
      }
      if (node && node.isBranch && node.hasChildren) {
        const foundNode = findNodeByObjectId(node.rawChildren, objectId)
        if (foundNode) {
          return foundNode
        }
      }
    }
    return undefined
  }

  const expandToNode = (objectId: string | number): TreeNode | undefined => {
    const node = findNodeByObjectId(nodes.value, objectId)
    if (!node) {
      return undefined
    }

    getHierarchy(node).forEach(ancestor => {
      if (ancestor.isBranch) {
        ancestor.toggleCollapse(false)
      }
    })

    return node
  }

  const selectedNodes = computed(() => getNodes(Array.from(selectedIds.value.values())))
  const expandedIds = computed(() => Array.from(nodesMap.value.keys()).filter(id => !collapsedIds.value.has(id)))
  const activeNode = computed(() => getNode(activeId.value))

  const selectedLabel = computed(() => {
    if (typeof options.selectedLabel === 'function') {
      return options.selectedLabel(selectedNodes.value)
    }

    if (typeof options.selectedLabel === 'object' && selectedNodes.value.length > options.selectedLabel.max) {
      return options.selectedLabel.fn(selectedNodes.value.length)
    }

    return selectedNodes.value.map(node => node.label).join(', ')
  })

  return {
    nodes: visibleNodes,
    flatNodes,
    flatNodeIndexById,
    activeId,
    activeNode,
    selectedIds,
    selectedNodes,
    selectedLabel,
    collapsedIds,
    expandedIds,
    options,
    expandToNode,
  }
}
