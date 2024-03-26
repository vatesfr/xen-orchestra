import { BranchDefinition } from '@core/composables/tree/branch-definition'
import { LeafDefinition } from '@core/composables/tree/leaf-definition'
import type { TreeNodeOptions, Definition, Identifiable, Labeled } from '@core/composables/tree/types'

// Overload 1: Leaf with no options
export function defineTree<TData extends Identifiable & Labeled, const TDiscriminator = any>(
  entries: TData[]
): LeafDefinition<TData, TDiscriminator>[]

// Overload 2: Leaf with options
export function defineTree<TData extends object, const TDiscriminator = any>(
  entries: TData[],
  options: TreeNodeOptions<TData, TDiscriminator>
): LeafDefinition<TData, TDiscriminator>[]

// Overload 3: Branch with no options
export function defineTree<
  TData extends Identifiable & Labeled,
  TChildDefinition extends Definition,
  const TDiscriminator = any,
>(
  entries: TData[],
  getChildren: (data: TData) => TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator>[]

// Overload 4: Branch with options
export function defineTree<
  TData extends object,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
>(
  entries: TData[],
  options: TreeNodeOptions<TData, TDiscriminator>,
  getChildren: (data: TData) => TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator>[]

// Implementation
export function defineTree<
  TData extends object,
  TChildDefinition extends Definition = Definition,
  const TDiscriminator = any,
>(
  entries: TData[],
  optionsOrGetChildren?: TreeNodeOptions<TData, TDiscriminator> | ((data: TData) => TChildDefinition[]),
  getChildren?: (data: TData) => TChildDefinition[]
) {
  const options = (typeof optionsOrGetChildren === 'function' ? {} : optionsOrGetChildren ?? {}) as TreeNodeOptions<
    TData,
    TDiscriminator
  >

  const getChildrenFn = typeof optionsOrGetChildren === 'function' ? optionsOrGetChildren : getChildren

  if (getChildrenFn !== undefined) {
    return entries.map(data => new BranchDefinition(data, options, getChildrenFn(data)))
  }

  return entries.map(data => new LeafDefinition(data, options))
}
