import { TreeNodeDefinitionBase } from '@core/packages/tree/tree-node-definition-base'
import type { TreeNodeDefinition, TreeNodeOptions } from '@core/packages/tree/types'

export class BranchDefinition<
  TData extends object = any,
  TChildDefinition extends TreeNodeDefinition = TreeNodeDefinition,
  const TDiscriminator = any,
> extends TreeNodeDefinitionBase<TData, TDiscriminator> {
  readonly isBranch = true
  children: TChildDefinition[]

  constructor(
    treeId: string,
    data: TData,
    options: TreeNodeOptions<TData, TDiscriminator>,
    children: TChildDefinition[]
  ) {
    super(treeId, data, options)

    this.children = children
  }
}
