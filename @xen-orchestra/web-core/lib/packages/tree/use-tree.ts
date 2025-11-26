import { buildNodes } from '@core/packages/tree/build-nodes'
import type {
  DefinitionToTreeNode,
  TreeContext,
  TreeNode,
  TreeNodeDefinition,
  TreeNodeId,
  UseTreeOptions,
} from '@core/packages/tree/types'
import { useTimeoutFn } from '@vueuse/core'
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

  const getPathToNode = (node: TreeNode | undefined) => {
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
        const found = findNodeByObjectId(node.rawChildren, objectId)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }

  const scrollToNodeElement = async (id: string | number, options?: ScrollIntoViewOptions) => {
    const node = findNodeByObjectId(nodes.value, id)
    if (!node) {
      if (id) {
        useTimeoutFn(async () => {
          await scrollToNodeElement(id, options)
        }, 200)
      }
      return
    }

    getPathToNode(node).forEach(node => {
      if (node.isBranch) {
        node.toggleCollapse(false)
      }
    })

    const nodeElement = document.querySelector<HTMLElement>(`[data-node-id="${node.data.id}"]`)
    if (!nodeElement) {
      useTimeoutFn(async () => {
        await scrollToNodeElement(id, options)
      }, 200)
      return
    }

    const hasChildren = node.isBranch && node.hasChildren
    const cfg: ScrollIntoViewOptions = options ?? { block: hasChildren ? 'start' : 'center', behavior: 'smooth' }

    if (hasChildren) {
      nodeElement.style.scrollMarginTop = '0.8rem'

      useTimeoutFn(async () => {
        nodeElement.style.scrollMarginTop = ''
      }, 1000)
    }

    nodeElement.scrollIntoView(cfg)
  }

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
    scrollToNodeElement,
  }
}
