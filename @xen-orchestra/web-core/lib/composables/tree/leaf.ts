import { TreeNodeBase } from '@core/composables/tree/tree-node-base'

export class Leaf<T extends object = any, const TDiscriminator = any> extends TreeNodeBase<T, TDiscriminator> {
  readonly isGroup = false

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

  get labelClasses() {
    return {
      active: this.isActive,
      selected: this.isSelected,
      matches: this.passesFilter === true,
    }
  }
}
