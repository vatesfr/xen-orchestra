import { Base } from '@core/composables/collection/base'
import type { CollectionContext, Item, ItemOptions } from '@core/composables/collection/types'

export class Group<T extends object = any, TChild extends Item = Item, const TDiscriminator = any> extends Base<
  T,
  TDiscriminator
> {
  readonly isGroup = true
  readonly rawChildren: TChild[]

  constructor(
    data: T,
    parent: Group | undefined,
    context: CollectionContext,
    depth: number,
    options: ItemOptions<T, TDiscriminator> | undefined,
    getChildren: (thisGroup: Group<T, TChild, TDiscriminator>) => TChild[]
  ) {
    super(data, parent, context, depth, options)
    this.rawChildren = getChildren(this)
  }

  get children() {
    return this.rawChildren.filter(child => child.isVisible)
  }

  get passesFilterDownwards(): boolean {
    return this.passesFilter || this.rawChildren.some(child => child.passesFilterDownwards)
  }

  get isVisible() {
    if (this.passesFilterUpwards || this.passesFilterDownwards) {
      return true
    }

    if (this.passesFilter === false) {
      return false
    }

    return this.parent?.isExpanded ?? true
  }

  get isExpanded() {
    return this.context.expanded.has(this.id) || this.passesFilterDownwards || this.passesFilterUpwards
  }

  get areChildrenFullySelected(): boolean {
    if (!this.context.allowMultiSelect) {
      console.warn('allowMultiSelect must be enabled to use areChildrenFullySelected')
      return false
    }

    return this.rawChildren.every(child => (child.isGroup ? child.areChildrenFullySelected : child.isSelected))
  }

  get areChildrenPartiallySelected(): boolean {
    if (!this.context.allowMultiSelect) {
      console.warn('allowMultiSelect must be enabled to use areChildrenPartiallySelected')
      return false
    }

    if (this.areChildrenFullySelected) {
      return false
    }

    return this.rawChildren.some(child => (child.isGroup ? child.areChildrenPartiallySelected : child.isSelected))
  }

  get labelClasses() {
    return {
      active: this.isActive,
      selected: this.isSelected,
      matches: this.passesFilter === true,
      'selected-partial': this.context.allowMultiSelect && this.areChildrenPartiallySelected,
      'selected-full': this.context.allowMultiSelect && this.areChildrenFullySelected,
      expanded: this.isExpanded,
    }
  }

  get childrenSelectedState() {
    console.warn('allowMultiSelect must be enabled to use childrenSelectedState')
    return this.areChildrenFullySelected ? 'all' : this.areChildrenPartiallySelected ? 'some' : 'none'
  }

  toggleExpand(force?: boolean, recursive?: boolean) {
    const shouldExpand = force ?? !this.isExpanded

    if (shouldExpand) {
      this.context.expanded.set(this.id, this as Item)
    } else {
      this.context.expanded.delete(this.id)
    }

    const shouldPropagate = recursive ?? !shouldExpand

    if (shouldPropagate) {
      this.rawChildren.forEach(child => {
        if (child.isGroup) {
          child.toggleExpand(shouldExpand, recursive)
        }
      })
    }
  }

  toggleChildrenSelect(force?: boolean) {
    if (!this.context.allowMultiSelect) {
      console.warn('allowMultiSelect must be enabled to use toggleChildrenSelect')
      return
    }

    const shouldSelect = force ?? !this.areChildrenFullySelected
    this.rawChildren.forEach(child => {
      child instanceof Group ? child.toggleChildrenSelect(shouldSelect) : child.toggleSelect(shouldSelect)
    })
  }
}
