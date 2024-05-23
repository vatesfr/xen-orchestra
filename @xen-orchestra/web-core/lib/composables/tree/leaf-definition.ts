import { TreeNodeDefinitionBase } from '@core/composables/tree/tree-node-definition-base'

export class LeafDefinition<TData extends object = any, const TDiscriminator = any> extends TreeNodeDefinitionBase<
  TData,
  TDiscriminator
> {
  readonly isBranch = false
}
