import type { Branch } from '@core/composables/tree/branch'
import type { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Leaf } from '@core/composables/tree/leaf'
import type { LeafDefinition } from '@core/composables/tree/leaf-definition'

export type Identifiable = { id: string | number }

export type Labeled = { label: string }

type AcceptableKeys<T, TAccepted> = {
  [K in keyof T]: T[K] extends TAccepted ? K : never
}[keyof T]

type AcceptableGetter<T, TAccepted> = AcceptableKeys<T, TAccepted> | ((data: T) => TAccepted)

export type BaseOptions<T, TDiscriminator> = {
  discriminator?: TDiscriminator
  predicate?: (data: T) => boolean | undefined
  activable?: boolean
}

type GetIdOption<T extends object> = T extends Identifiable
  ? { getId?: AcceptableGetter<T, string | number> }
  : { getId: AcceptableGetter<T, string | number> }

type GetLabelOption<T extends object> = T extends Labeled
  ? { getLabel?: AcceptableGetter<T, string> }
  : { getLabel: AcceptableGetter<T, string> }

export type ItemOptions<T extends object, TDiscriminator> = BaseOptions<T, TDiscriminator> &
  GetIdOption<T> &
  GetLabelOption<T>

export type Definition = LeafDefinition | BranchDefinition

export type DefinitionToItem<TDefinition> =
  TDefinition extends BranchDefinition<infer T, infer TChildDefinition, infer TDiscriminator>
    ? Branch<T, DefinitionToItem<TChildDefinition>, TDiscriminator>
    : TDefinition extends LeafDefinition<infer T, infer TDiscriminator>
      ? Leaf<T, TDiscriminator>
      : never

export type Item = Leaf | Branch

export type CollectionContext<TItem extends Item = Item> = {
  allowMultiSelect: boolean
  selectedItems: Map<string | number, TItem>
  expandedItems: Map<string | number, TItem>
  activeItem: TItem | undefined
}

export type UseCollectionOptions = {
  allowMultiSelect?: boolean
  expand?: boolean
  selectedLabel?:
    | ((items: Item[]) => string)
    | {
        max: number
        fn: (count: number) => string
      }
}
