import { TreeNodeDefinitionBase } from '@core/composables/tree/tree-node-definition-base'

export class LeafDefinition<T extends object = any, const TDiscriminator = any> extends TreeNodeDefinitionBase<
  T,
  TDiscriminator
> {}
