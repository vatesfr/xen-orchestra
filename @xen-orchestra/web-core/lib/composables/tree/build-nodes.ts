import { Branch } from '@core/composables/tree/branch'
import { Leaf } from '@core/composables/tree/leaf'
import type { DefinitionToTreeNode, TreeContext, TreeNode, TreeNodeDefinition } from '@core/composables/tree/types'

export function buildNodes<TDefinition extends TreeNodeDefinition, TTreeNode extends DefinitionToTreeNode<TDefinition>>(
  definitions: TDefinition[],
  context: TreeContext
): TTreeNode[] {
  function create(definitions: TreeNodeDefinition[], parent: Branch | undefined, depth: number): TreeNode[] {
    return definitions.map(definition =>
      definition.isBranch
        ? new Branch(definition.data, parent, context, depth, definition.options, thisBranch =>
            create(definition.children, thisBranch, depth + 1)
          )
        : new Leaf(definition.data, parent, context, depth, definition.options)
    )
  }

  return create(definitions, undefined, 0) as TTreeNode[]
}
