import type { ItemOptions } from '@core/composables/collection/types'

export abstract class DefinitionBase<T extends object, TDiscriminator> {
  data: T
  options: ItemOptions<T, TDiscriminator>

  constructor(data: T, options: ItemOptions<T, TDiscriminator>) {
    this.data = data
    this.options = options
  }
}
