import type { Group } from '@core/composables/collection/group'
import type { CollectionContext, Identifiable, Item, ItemOptions } from '@core/composables/collection/types'

export abstract class Base<T extends object = any, TDiscriminator = any> {
  abstract readonly isGroup: boolean
  abstract passesFilterDownwards: boolean
  abstract isVisible: boolean
  abstract labelClasses: Record<string, boolean>

  readonly data: T
  readonly depth: number
  readonly parent: Group | undefined
  readonly context: CollectionContext
  readonly options: ItemOptions<T, TDiscriminator>

  constructor(
    data: T,
    parent: Group | undefined,
    context: CollectionContext,
    depth: number,
    options?: ItemOptions<T, TDiscriminator>
  ) {
    this.data = data
    this.parent = parent
    this.context = context
    this.depth = depth
    this.options = options ?? ({} as ItemOptions<T, TDiscriminator>)
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
      return (this.data as { label: string }).label
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
    return this.context.selected.has(this.id)
  }

  get isActive() {
    return this.context.active?.id === this.id
  }

  get passesFilterUpwards(): boolean {
    return this.passesFilter || (this.parent?.passesFilterUpwards ?? false)
  }

  activate() {
    if (this.options.activable === false) {
      return
    }

    this.context.active = this as unknown as Item
  }

  toggleSelect(force?: boolean) {
    const shouldSelect = force ?? !this.isSelected

    if (shouldSelect) {
      if (!this.context.allowMultiSelect) {
        this.context.selected.clear()
      }

      this.context.selected.set(this.id, this as unknown as Item)
    } else {
      this.context.selected.delete(this.id)
    }
  }
}
