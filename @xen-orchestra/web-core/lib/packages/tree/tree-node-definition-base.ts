import type { TreeNodeOptions } from '@core/packages/tree/types'

export abstract class TreeNodeDefinitionBase<TData extends object, TDiscriminator> {
  abstract readonly isBranch: boolean
  readonly treeId: string
  data: TData
  options: TreeNodeOptions<TData, TDiscriminator>

  constructor(treeId: string, data: TData, options: TreeNodeOptions<TData, TDiscriminator>) {
    this.treeId = treeId
    this.data = data
    this.options = options
  }
}
