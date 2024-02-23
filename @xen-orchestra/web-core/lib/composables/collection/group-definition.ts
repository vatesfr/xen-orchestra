import { DefinitionBase } from '@core/composables/collection/definition-base'
import type { Definition, ItemOptions } from '@core/composables/collection/types'

export class GroupDefinition<
  T extends object = any,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
> extends DefinitionBase<T, TDiscriminator> {
  children: TChildDefinition[]

  constructor(data: T, options: ItemOptions<T, TDiscriminator>, children: TChildDefinition[]) {
    super(data, options)

    this.children = children
  }
}
