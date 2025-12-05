import { buildNodes } from '@core/packages/tree/build-nodes'
import type {
  DefinitionToTreeNode,
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
  }) satisfies TreeContext

  const nodes = computed(() => {
    const nodes = buildNodes<TDefinition, TTreeNode>(toValue(definitions), context)

    if (options.collapse) {
      nodes.forEach(node => node.isBranch && node.toggleCollapse(true, true))
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

  function getNode(id: TreeNodeId | undefined): TreeNode | undefined {
    if (id === undefined) {
      return undefined
    }

    return nodesMap.value.get(id)
  }

  const selectedNodes = computed(() =>
    Array.from(selectedIds.value.values())
      .map(id => getNode(id))
      .filter(node => node !== undefined)
  )

  const expandedIds = computed(() => Array.from(nodesMap.value.keys()).filter(id => !collapsedIds.value.has(id)))

  const expandedNodes = computed(() => expandedIds.value.map(id => getNode(id)).filter(node => node !== undefined))

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
  }
}
