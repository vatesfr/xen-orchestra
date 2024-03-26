import type { TreeNodeOptions } from '@core/composables/tree/types'

export abstract class TreeNodeDefinitionBase<T extends object, TDiscriminator> {
  data: T
  options: TreeNodeOptions<T, TDiscriminator>

  constructor(data: T, options: TreeNodeOptions<T, TDiscriminator>) {
    this.data = data
    this.options = options
  }
}
