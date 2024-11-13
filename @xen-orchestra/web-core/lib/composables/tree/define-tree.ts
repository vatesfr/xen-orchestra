import { BranchDefinition } from '@core/composables/tree/branch-definition'
import { LeafDefinition } from '@core/composables/tree/leaf-definition'
import type {
  ChildTreeDefinitionGetter,
  Identifiable,
  Labeled,
  TreeNodeDefinition,
  TreeNodeOptions,
} from '@core/composables/tree/types'

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
  TChildDefinition extends TreeNodeDefinition,
  const TDiscriminator = any,
>(
  entries: TData[],
  getChildTree: ChildTreeDefinitionGetter<TData, TChildDefinition>
): BranchDefinition<TData, TChildDefinition, TDiscriminator>[]

// Overload 4: Branch with options
export function defineTree<
  TData extends object,
  TChildDefinition extends TreeNodeDefinition = TreeNodeDefinition,
  const TDiscriminator = any,
>(
  entries: TData[],
  options: TreeNodeOptions<TData, TDiscriminator>,
  getChildTree: ChildTreeDefinitionGetter<TData, TChildDefinition>
): BranchDefinition<TData, TChildDefinition, TDiscriminator>[]

// Implementation
export function defineTree<
  TData extends object,
  TChildDefinition extends TreeNodeDefinition = TreeNodeDefinition,
  const TDiscriminator = any,
>(
  entries: TData[],
  optionsOrGetChildTree?: TreeNodeOptions<TData, TDiscriminator> | ChildTreeDefinitionGetter<TData, TChildDefinition>,
  getChildTreeOrNone?: ChildTreeDefinitionGetter<TData, TChildDefinition>
) {
  const options = (typeof optionsOrGetChildTree === 'function' ? {} : (optionsOrGetChildTree ?? {})) as TreeNodeOptions<
    TData,
    TDiscriminator
  >

  const getChildTree = typeof optionsOrGetChildTree === 'function' ? optionsOrGetChildTree : getChildTreeOrNone

  if (getChildTree !== undefined) {
    return entries.map(data => new BranchDefinition(data, options, getChildTree(data)))
  }

  return entries.map(data => new LeafDefinition(data, options))
}
