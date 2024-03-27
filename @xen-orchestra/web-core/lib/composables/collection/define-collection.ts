import { GroupDefinition } from '@core/composables/collection/group-definition'
import { LeafDefinition } from '@core/composables/collection/leaf-definition'
import type { ItemOptions, Definition, Identifiable, Labeled } from '@core/composables/collection/types'

// Overload 1: Leaf with no options
export function defineCollection<T extends Identifiable & Labeled, const TDiscriminator = any>(
  entries: T[]
): LeafDefinition<T, TDiscriminator>[]

// Overload 2: Leaf with options
export function defineCollection<T extends object, const TDiscriminator = any>(
  entries: T[],
  options: ItemOptions<T, TDiscriminator>
): LeafDefinition<T, TDiscriminator>[]

// Overload 3: Group with no options
export function defineCollection<
  T extends Identifiable & Labeled,
  TChildDefinition extends Definition,
  const TDiscriminator = any,
>(entries: T[], getChildren: (data: T) => TChildDefinition[]): GroupDefinition<T, TChildDefinition, TDiscriminator>[]

// Overload 4: Group with options
export function defineCollection<
  T extends object,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
>(
  entries: T[],
  options: ItemOptions<T, TDiscriminator>,
  getChildren: (data: T) => TChildDefinition[]
): GroupDefinition<T, TChildDefinition, TDiscriminator>[]

// Implementation
export function defineCollection<
  T extends object,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
>(
  entries: T[],
  optionsOrGetChildren?: ItemOptions<T, TDiscriminator> | ((data: T) => TChildDefinition[]),
  getChildren?: (data: T) => TChildDefinition[]
) {
  const options = (typeof optionsOrGetChildren === 'function' ? {} : optionsOrGetChildren ?? {}) as ItemOptions<
    T,
    TDiscriminator
  >

  const getChildrenFn = typeof optionsOrGetChildren === 'function' ? optionsOrGetChildren : getChildren

  if (getChildrenFn !== undefined) {
    return entries.map(data => new GroupDefinition(data, options, getChildrenFn(data)))
  }

  return entries.map(data => new LeafDefinition(data, options))
}
