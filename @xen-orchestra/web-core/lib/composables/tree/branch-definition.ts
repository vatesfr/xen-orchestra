import { TreeNodeDefinitionBase } from '@core/composables/tree/tree-node-definition-base'
import type { TreeNodeDefinition, TreeNodeOptions } from '@core/composables/tree/types'

export class BranchDefinition<
  TData extends object = any,
  TChildDefinition extends TreeNodeDefinition = TreeNodeDefinition,
  const TDiscriminator = any,
> extends TreeNodeDefinitionBase<TData, TDiscriminator> {
  readonly isBranch = true
  children: TChildDefinition[]

  constructor(data: TData, options: TreeNodeOptions<TData, TDiscriminator>, children: TChildDefinition[]) {
    super(data, options)

    this.children = children
  }
}
