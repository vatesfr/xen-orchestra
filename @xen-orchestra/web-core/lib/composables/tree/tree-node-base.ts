import type { Branch } from '@core/composables/tree/branch'
import type { TreeContext, Identifiable, TreeNode, TreeNodeOptions, Labeled } from '@core/composables/tree/types'

export abstract class TreeNodeBase<TData extends object = any, TDiscriminator = any> {
  abstract readonly isBranch: boolean
  abstract passesFilterDownwards: boolean
  abstract isVisible: boolean
  abstract labelClasses: Record<string, boolean>

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

  get id() {
    if (this.options.getId === undefined) {
      return (this.data as Identifiable).id
    }

    if (typeof this.options.getId === 'function') {
      return this.options.getId(this.data)
    }

    return this.data[this.options.getId]
  }

  get label() {
    if (this.options.getLabel === undefined) {
      return (this.data as Labeled).label
    }

    if (typeof this.options.getLabel === 'function') {
      return this.options.getLabel(this.data)
    }

    return this.data[this.options.getLabel]
  }

  get discriminator() {
    return this.options.discriminator
  }

  get passesFilter() {
    return this.options.predicate?.(this.data)
  }

  get isSelected() {
    return this.context.selectedNodes.has(this.id)
  }

  get isActive() {
    return this.context.activeNode?.id === this.id
  }

  get passesFilterUpwards(): boolean {
    return this.passesFilter || (this.parent?.passesFilterUpwards ?? false)
  }

  activate() {
    if (this.options.activable === false) {
      return
    }

    this.context.activeNode = this as unknown as TreeNode
  }

  toggleSelect(forcedValue?: boolean) {
    const shouldSelect = forcedValue ?? !this.isSelected

    if (shouldSelect) {
      if (!this.context.allowMultiSelect) {
        this.context.selectedNodes.clear()
      }

      this.context.selectedNodes.set(this.id, this as unknown as TreeNode)
    } else {
      this.context.selectedNodes.delete(this.id)
    }
  }
}
