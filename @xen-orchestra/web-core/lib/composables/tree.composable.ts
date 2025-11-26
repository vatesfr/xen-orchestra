import { buildNodes } from '@core/composables/tree/build-nodes'
import type {
  DefinitionToTreeNode,
  TreeContext,
  TreeNode,
  TreeNodeDefinition,
  TreeNodeId,
  UseTreeOptions,
} from '@core/composables/tree/types'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'

export function useTree<
  TDefinition extends TreeNodeDefinition,
  TTreeNode extends DefinitionToTreeNode<TDefinition> = DefinitionToTreeNode<TDefinition>,
>(definitions: MaybeRefOrGetter<TDefinition[]>, options: UseTreeOptions = {}) {
  const selectedIds = ref(new Set<TreeNodeId>())
  const expandedIds = ref(new Set<TreeNodeId>())
  const activeId = ref<TreeNodeId>()

  const context = reactive({
    allowMultiSelect: options.allowMultiSelect ?? false,
    selectedIds,
    expandedIds,
    activeId,
  }) as TreeContext

  const nodes = computed(() => {
    const nodes = buildNodes<TDefinition, TTreeNode>(toValue(definitions), context)

    if (options.expand !== false) {
      nodes.forEach(node => node.isBranch && node.toggleExpand(true, true))
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

  const getNode = (id: TreeNodeId | undefined) => (id !== undefined ? nodesMap.value.get(id) : undefined)
  const getNodes = (ids: TreeNodeId[]) => ids.map(getNode).filter(node => node !== undefined) as TreeNode[]

  const getPathToNode = (node: TreeNode | undefined) => {
    const path: TreeNode[] = []
    while (node) {
      path.unshift(node)
      node = node.parent
    }
    return path
  }

  function findNodeByObjectId(nodes: any[], objectId: string | number): any | undefined {
    for (const node of nodes) {
      if (node && node.data && (node.data.id === objectId || String(node.data.id) === String(objectId))) {
        return node
      }
      if (node && node.rawChildren && node.rawChildren.length > 0) {
        const found = findNodeByObjectId(node.rawChildren, objectId)
        if (found) return found
      }
    }
    return undefined
  }

  const scrollToNodeElement = async (id: string | number, options?: ScrollIntoViewOptions) => {
    const node = findNodeByObjectId(nodes.value, id)
    if (!node) {
      return
    }

    getPathToNode(node).forEach(node => {
      if (node.isBranch) {
        node.toggleExpand(true)
      }
    })

    const nodeElement = document.querySelector<HTMLElement>(`[data-node-id="${node.id}"]`)
    if (nodeElement) {
      const hasChildren = node.isBranch && node.rawChildren.length > 0
      const cfg: ScrollIntoViewOptions = options ?? { block: hasChildren ? 'start' : 'center', behavior: 'smooth' }
      nodeElement.scrollIntoView(cfg)
      return nodeElement
    }

    return null
  }

  const selectedNodes = computed(() => getNodes(Array.from(selectedIds.value.values())))
  const expandedNodes = computed(() => getNodes(Array.from(expandedIds.value.values())))
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
    activeId,
    activeNode,
    selectedIds,
    selectedNodes,
    selectedLabel,
    expandedIds,
    expandedNodes,
    options,
    scrollToNodeElement,
  }
}
