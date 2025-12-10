import { BranchDefinition } from '@core/packages/tree/branch-definition'
import type { Identifiable, Labeled, TreeNodeDefinition, TreeNodeOptions } from '@core/packages/tree/types'

export function defineBranch<
  TData extends Identifiable & Labeled,
  TChildDefinition extends TreeNodeDefinition,
  const TDiscriminator,
>(treeId: string, data: TData, children: TChildDefinition[]): BranchDefinition<TData, TChildDefinition, TDiscriminator>

export function defineBranch<TData extends object, TChildDefinition extends TreeNodeDefinition, const TDiscriminator>(
  treeId: string,
  data: TData,
  options: TreeNodeOptions<TData, TDiscriminator>,
  children: TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator>

export function defineBranch<TData extends object, TChildDefinition extends TreeNodeDefinition, const TDiscriminator>(
  treeId: string,
  data: TData,
  optionsOrChildren: TreeNodeOptions<TData, TDiscriminator> | TChildDefinition[],
  childrenOrNone?: TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator> {
  const options = Array.isArray(optionsOrChildren) ? ({} as TreeNodeOptions<TData, TDiscriminator>) : optionsOrChildren
  const children = Array.isArray(optionsOrChildren) ? optionsOrChildren : childrenOrNone!

  return new BranchDefinition(treeId, data, options, children)
}
