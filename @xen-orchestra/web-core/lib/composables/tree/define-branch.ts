import { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Identifiable, Labeled, TreeNodeDefinition, TreeNodeOptions } from '@core/composables/tree/types'

export function defineBranch<
  TData extends Identifiable & Labeled,
  TChildDefinition extends TreeNodeDefinition,
  const TDiscriminator,
>(data: TData, children: TChildDefinition[]): BranchDefinition<TData, TChildDefinition, TDiscriminator>
export function defineBranch<TData extends object, TChildDefinition extends TreeNodeDefinition, const TDiscriminator>(
  data: TData,
  options: TreeNodeOptions<TData, TDiscriminator>,
  children: TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator>
export function defineBranch<TData extends object, TChildDefinition extends TreeNodeDefinition, const TDiscriminator>(
  data: TData,
  optionsOrChildren: TreeNodeOptions<TData, TDiscriminator> | TChildDefinition[],
  childrenOrNone?: TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator> {
  const options = Array.isArray(optionsOrChildren) ? ({} as TreeNodeOptions<TData, TDiscriminator>) : optionsOrChildren
  const children = Array.isArray(optionsOrChildren) ? optionsOrChildren : childrenOrNone!

  return new BranchDefinition(data, options, children)
}
