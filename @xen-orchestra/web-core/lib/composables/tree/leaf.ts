import { TreeNodeBase } from '@core/composables/tree/tree-node-base'
import type { LeafStatuses } from '@core/composables/tree/types'

export class Leaf<TData extends object = any, const TDiscriminator = any> extends TreeNodeBase<TData, TDiscriminator> {
  readonly isBranch = false

  get passesFilterDownwards(): boolean {
    return this.passesFilter ?? false
  }

  get isVisible() {
    if (this.passesFilterUpwards) {
      return true
    }

    if (this.passesFilter === false) {
      return false
    }

    return this.parent?.isExpanded ?? true
  }

  get statuses(): LeafStatuses {
    return {
      active: this.isActive,
      selected: this.isSelected,
      matches: this.passesFilter === true,
    }
  }
}
