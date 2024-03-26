import { BranchDefinition } from '@core/composables/tree/branch-definition'
import { LeafDefinition } from '@core/composables/tree/leaf-definition'
import type { TreeNodeOptions, Definition, Identifiable, Labeled } from '@core/composables/tree/types'

// Overload 1: Leaf with no options
export function defineTree<T extends Identifiable & Labeled, const TDiscriminator = any>(
  entries: T[]
): LeafDefinition<T, TDiscriminator>[]

// Overload 2: Leaf with options
export function defineTree<T extends object, const TDiscriminator = any>(
  entries: T[],
  options: TreeNodeOptions<T, TDiscriminator>
): LeafDefinition<T, TDiscriminator>[]

// Overload 3: Branch with no options
export function defineTree<
  T extends Identifiable & Labeled,
  TChildDefinition extends Definition,
  const TDiscriminator = any,
>(entries: T[], getChildren: (data: T) => TChildDefinition[]): BranchDefinition<T, TChildDefinition, TDiscriminator>[]

// Overload 4: Branch with options
export function defineTree<
  T extends object,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
>(
  entries: T[],
  options: TreeNodeOptions<T, TDiscriminator>,
  getChildren: (data: T) => TChildDefinition[]
): BranchDefinition<T, TChildDefinition, TDiscriminator>[]

// Implementation
export function defineTree<
  T extends object,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
>(
  entries: T[],
  optionsOrGetChildren?: TreeNodeOptions<T, TDiscriminator> | ((data: T) => TChildDefinition[]),
  getChildren?: (data: T) => TChildDefinition[]
) {
  const options = (typeof optionsOrGetChildren === 'function' ? {} : optionsOrGetChildren ?? {}) as TreeNodeOptions<
    T,
    TDiscriminator
  >

  const getChildrenFn = typeof optionsOrGetChildren === 'function' ? optionsOrGetChildren : getChildren

  if (getChildrenFn !== undefined) {
    return entries.map(data => new BranchDefinition(data, options, getChildrenFn(data)))
  }

  return entries.map(data => new LeafDefinition(data, options))
}
