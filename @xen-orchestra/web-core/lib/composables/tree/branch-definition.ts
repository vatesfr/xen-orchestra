import { TreeNodeDefinitionBase } from '@core/composables/tree/tree-node-definition-base'
import type { Definition, ItemOptions } from '@core/composables/tree/types'

export class BranchDefinition<
  T extends object = any,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
> extends TreeNodeDefinitionBase<T, TDiscriminator> {
  children: TChildDefinition[]

  constructor(data: T, options: ItemOptions<T, TDiscriminator>, children: TChildDefinition[]) {
    super(data, options)

    this.children = children
  }
}
