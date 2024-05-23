import { TreeNodeBase } from '@core/composables/tree/tree-node-base'
import type { LeafStatuses } from '@core/composables/tree/types'

export class Leaf<TData extends object = any, const TDiscriminator = any> extends TreeNodeBase<TData, TDiscriminator> {
  readonly isBranch = false

  get passesFilterDownwards(): boolean {
    return this.passesFilter ?? false
  }

  get failsFilterDownwards(): boolean {
    return this.passesFilter === false
  }

  get isExcluded() {
    if (this.parent?.isExpanded === false) {
      return true
    }

    if (this.passesFilterUpwards) {
      return false
    }

    return this.passesFilter === false
  }

  get statuses(): LeafStatuses {
    return {
      active: this.isActive,
      selected: this.isSelected,
      matches: this.passesFilter === true,
    }
  }
}
