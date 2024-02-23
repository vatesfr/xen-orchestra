import type { Group } from '@core/composables/collection/group'
import type { GroupDefinition } from '@core/composables/collection/group-definition'
import type { Leaf } from '@core/composables/collection/leaf'
import type { LeafDefinition } from '@core/composables/collection/leaf-definition'

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

export type Definition = LeafDefinition | GroupDefinition

export type DefinitionToItem<TDefinition> =
  TDefinition extends GroupDefinition<infer T, infer TChildDefinition, infer TDiscriminator>
    ? Group<T, DefinitionToItem<TChildDefinition>, TDiscriminator>
    : TDefinition extends LeafDefinition<infer T, infer TDiscriminator>
      ? Leaf<T, TDiscriminator>
      : never

export type Item = Leaf | Group

export type CollectionContext<TItem extends Item = Item> = {
  allowMultiSelect: boolean
  selected: Map<string | number, TItem>
  expanded: Map<string | number, TItem>
  active: TItem | undefined
}
