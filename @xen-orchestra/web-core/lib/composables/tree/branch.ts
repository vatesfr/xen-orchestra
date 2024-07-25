import { TreeNodeBase } from '@core/composables/tree/tree-node-base'
import type {
  BranchStatuses,
  ChildTreeGetter,
  TreeContext,
  TreeNode,
  TreeNodeOptions,
} from '@core/composables/tree/types'

export class Branch<
  TData extends object = any,
  TChildNode extends TreeNode = TreeNode,
  const TDiscriminator = any,
> extends TreeNodeBase<TData, TDiscriminator> {
  readonly isBranch = true
  readonly rawChildren: TChildNode[]

  constructor(
    data: TData,
    parent: Branch | undefined,
    context: TreeContext,
    depth: number,
    options: TreeNodeOptions<TData, TDiscriminator> | undefined,
    getChildTree: ChildTreeGetter<TData, TChildNode, TDiscriminator>
  ) {
    super(data, parent, context, depth, options)
    this.rawChildren = getChildTree(this)
  }

  get children() {
    return this.rawChildren.filter(child => !child.isExcluded)
  }

  get hasChildren() {
    return this.rawChildren.length > 0
  }

  get passesFilterDownwards(): boolean {
    return this.passesFilter || this.rawChildren.some(child => child.passesFilterDownwards)
  }

  get failsFilterDownwards(): boolean {
    if (this.passesFilter !== undefined) {
      return !this.passesFilter
    }

    return this.rawChildren.length > 0 && this.rawChildren.every(child => child.failsFilterDownwards)
  }

  get isExcluded() {
    if (this.parent?.isExpanded === false) {
      return true
    }

    if (this.passesFilterUpwards || this.passesFilterDownwards) {
      return false
    }

    return this.failsFilterDownwards
  }

  get isExpanded() {
    return this.context.expandedIds.has(this.id) || this.passesFilterDownwards || this.passesFilterUpwards
  }

  get areChildrenFullySelected(): boolean {
    if (!this.context.allowMultiSelect) {
      console.warn('allowMultiSelect must be enabled to use areChildrenFullySelected')
      return false
    }

    return this.rawChildren.every(child => (child.isBranch ? child.areChildrenFullySelected : child.isSelected))
  }

  get areChildrenPartiallySelected(): boolean {
    if (!this.context.allowMultiSelect) {
      console.warn('allowMultiSelect must be enabled to use areChildrenPartiallySelected')
      return false
    }

    if (this.areChildrenFullySelected) {
      return false
    }

    return this.rawChildren.some(child => (child.isBranch ? child.areChildrenPartiallySelected : child.isSelected))
  }

  get statuses(): BranchStatuses {
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

  toggleExpand(forcedValue?: boolean, recursive?: boolean) {
    const nextExpanded = forcedValue ?? !this.isExpanded

    if (nextExpanded) {
      this.context.expandedIds.add(this.id)
    } else {
      this.context.expandedIds.delete(this.id)
    }

    const shouldPropagate = recursive ?? !nextExpanded

    if (shouldPropagate) {
      this.rawChildren.forEach(child => {
        if (child.isBranch) {
          child.toggleExpand(nextExpanded, recursive)
        }
      })
    }
  }

  get shouldSelectChildren(): boolean {
    return this.children.some(child => (child.isBranch ? child.shouldSelectChildren : !child.isSelected))
  }

  toggleChildrenSelect(forcedValue?: boolean) {
    if (!this.context.allowMultiSelect) {
      console.warn('allowMultiSelect must be enabled to use toggleChildrenSelect')
      return
    }

    const shouldSelect = forcedValue ?? this.shouldSelectChildren
    this.rawChildren.forEach(child => {
      if (child.isBranch) {
        child.toggleChildrenSelect(shouldSelect)
      } else if (!child.isExcluded) {
        child.toggleSelect(shouldSelect)
      }
    })
  }
}
