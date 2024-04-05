import type { TreeNodeOptions } from '@core/composables/tree/types'

export abstract class TreeNodeDefinitionBase<TData extends object, TDiscriminator> {
  abstract readonly isBranch: boolean
  data: TData
  options: TreeNodeOptions<TData, TDiscriminator>

  constructor(data: TData, options: TreeNodeOptions<TData, TDiscriminator>) {
    this.data = data
    this.options = options
  }
}
