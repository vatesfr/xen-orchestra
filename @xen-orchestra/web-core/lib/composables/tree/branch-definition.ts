import { TreeNodeDefinitionBase } from '@core/composables/tree/tree-node-definition-base'
import type { Definition, TreeNodeOptions } from '@core/composables/tree/types'

export class BranchDefinition<
  TData extends object = any,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
> extends TreeNodeDefinitionBase<TData, TDiscriminator> {
  children: TChildDefinition[]

  constructor(data: TData, options: TreeNodeOptions<TData, TDiscriminator>, children: TChildDefinition[]) {
    super(data, options)

    this.children = children
  }
}
