import { TreeNodeDefinitionBase } from '@core/composables/tree/tree-node-definition-base'
import type { Definition, TreeNodeOptions } from '@core/composables/tree/types'

export class BranchDefinition<
  T extends object = any,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
> extends TreeNodeDefinitionBase<T, TDiscriminator> {
  children: TChildDefinition[]

  constructor(data: T, options: TreeNodeOptions<T, TDiscriminator>, children: TChildDefinition[]) {
    super(data, options)

    this.children = children
  }
}
