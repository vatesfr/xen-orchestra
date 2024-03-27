import { DefinitionBase } from '@core/composables/collection/definition-base'

export class LeafDefinition<T extends object = any, const TDiscriminator = any> extends DefinitionBase<
  T,
  TDiscriminator
> {}
