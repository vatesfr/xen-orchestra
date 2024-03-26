import { buildTree } from '@core/composables/tree/build-tree'
import type {
  CollectionContext,
  TreeNodeDefinition,
  DefinitionToTreeNode,
  TreeNode,
  UseCollectionOptions,
} from '@core/composables/tree/types'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'

export function useTree<
  TDefinition extends TreeNodeDefinition,
  TTreeNode extends TreeNode = DefinitionToTreeNode<TDefinition>,
>(definitions: MaybeRefOrGetter<TDefinition[]>, options?: UseCollectionOptions) {
  const context = reactive({
    allowMultiSelect: options?.allowMultiSelect ?? false,
    selectedNodes: ref(new Map()),
    expandedNodes: ref(new Map()),
    activeNode: ref(),
  }) as CollectionContext<TTreeNode>

  const selectedNodes = computed(() => Array.from(context.selectedNodes.values()))
  const expandedNodes = computed(() => Array.from(context.expandedNodes.values()))
  const activeNode = computed(() => context.activeNode)

  const rawNodes = computed(() => buildTree(toValue(definitions), context))
  const nodes = computed(() => rawNodes.value.filter(node => node.isVisible))

  if (options?.expand !== false) {
    nodes.value.forEach(node => node.isBranch && node.toggleExpand(true, true))
  }

  const deactivate = () => (context.activeNode = undefined)

  const selectedLabel = computed(() => {
    if (typeof options?.selectedLabel === 'function') {
      return options.selectedLabel(selectedNodes.value)
    }

    if (typeof options?.selectedLabel === 'object' && selectedNodes.value.length > options.selectedLabel.max) {
      return options.selectedLabel.fn(selectedNodes.value.length)
    }

    return selectedNodes.value.map(node => node.label).join(', ')
  })

  return {
    nodes,
    deactivate,
    activeNode,
    selectedNodes,
    selectedLabel,
    expandedNodes,
  }
}
