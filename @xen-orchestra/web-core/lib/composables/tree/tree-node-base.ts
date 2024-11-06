import type { Branch } from '@core/composables/tree/branch'
import type { Identifiable, Labeled, TreeContext, TreeNodeId, TreeNodeOptions } from '@core/composables/tree/types'

export abstract class TreeNodeBase<TData extends object = any, TDiscriminator = any> {
  abstract readonly isBranch: boolean
  abstract passesFilterDownwards: boolean
  abstract isExcluded: boolean
  abstract statuses: Record<string, boolean>

  readonly data: TData
  readonly depth: number
  readonly parent: Branch | undefined
  readonly context: TreeContext
  readonly options: TreeNodeOptions<TData, TDiscriminator>

  constructor(
    data: TData,
    parent: Branch | undefined,
    context: TreeContext,
    depth: number,
    options?: TreeNodeOptions<TData, TDiscriminator>
  ) {
    this.data = data
    this.parent = parent
    this.context = context
    this.depth = depth
    this.options = options ?? ({} as TreeNodeOptions<TData, TDiscriminator>)
  }

  get id(): TreeNodeId {
    if (this.options.getId === undefined) {
      return (this.data as Identifiable).id
    }

    if (typeof this.options.getId === 'function') {
      return this.options.getId(this.data as Identifiable)
    }

    return this.data[this.options.getId as keyof TData] as TreeNodeId
  }

  get label() {
    if (this.options.getLabel === undefined) {
      return (this.data as Labeled).label
    }

    if (typeof this.options.getLabel === 'function') {
      return this.options.getLabel(this.data as Labeled)
    }

    return this.data[this.options.getLabel as keyof TData]
  }

  get discriminator() {
    return this.options.discriminator
  }

  get passesFilter() {
    return this.options.predicate?.(this)
  }

  get isSelected() {
    return this.context.selectedIds.has(this.id)
  }

  get isActive() {
    return this.context.activeId === this.id
  }

  get passesFilterUpwards(): boolean {
    return this.passesFilter || (this.parent?.passesFilterUpwards ?? false)
  }

  get isSelectable() {
    return this.options.selectable?.(this.data) ?? !this.isBranch
  }

  activate() {
    if (!this.isSelectable) {
      return
    }

    this.context.activeId = this.id
  }

  toggleSelect(forcedValue?: boolean) {
    if (!this.isSelectable) {
      return
    }

    const shouldSelect = forcedValue ?? !this.isSelected

    if (shouldSelect) {
      if (!this.context.allowMultiSelect) {
        this.context.selectedIds.clear()
      }

      this.context.selectedIds.add(this.id)
    } else {
      this.context.selectedIds.delete(this.id)
    }
  }
}
