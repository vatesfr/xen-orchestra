import { Branch } from '@core/composables/tree/branch'
import { BranchDefinition } from '@core/composables/tree/branch-definition'
import { Leaf } from '@core/composables/tree/leaf'
import type { TreeContext, TreeNodeDefinition, DefinitionToTreeNode, TreeNode } from '@core/composables/tree/types'

export function buildTree<TDefinition extends TreeNodeDefinition>(
  definitions: TDefinition[],
  context: TreeContext
): DefinitionToTreeNode<TDefinition>[] {
  function create(definitions: TreeNodeDefinition[], parent: Branch | undefined, depth: number): TreeNode[] {
    return definitions.map(definition =>
      definition instanceof BranchDefinition
        ? new Branch(definition.data, parent, context, depth, definition.options, thisBranch =>
            create(definition.children, thisBranch, depth + 1)
          )
        : new Leaf(definition.data, parent, context, depth, definition.options)
    )
  }

  return create(definitions, undefined, 0) as DefinitionToTreeNode<TDefinition>[]
}
