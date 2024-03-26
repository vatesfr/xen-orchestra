import { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Definition, Identifiable, TreeNodeOptions, Labeled } from '@core/composables/tree/types'

export function defineBranch<
  TData extends Identifiable & Labeled,
  TChildDefinition extends Definition,
  const TDiscriminator,
>(data: TData, children: TChildDefinition[]): BranchDefinition<TData, TChildDefinition, TDiscriminator>
export function defineBranch<TData extends object, TChildDefinition extends Definition, const TDiscriminator>(
  data: TData,
  options: TreeNodeOptions<TData, TDiscriminator>,
  children: TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator>
export function defineBranch<TData extends object, TChildDefinition extends Definition, const TDiscriminator>(
  data: TData,
  optionsOrChildren: TreeNodeOptions<TData, TDiscriminator> | TChildDefinition[],
  children?: TChildDefinition[]
): BranchDefinition<TData, TChildDefinition, TDiscriminator> {
  const options = Array.isArray(optionsOrChildren) ? ({} as TreeNodeOptions<TData, TDiscriminator>) : optionsOrChildren
  const actualChildren = Array.isArray(optionsOrChildren) ? optionsOrChildren : children!

  return new BranchDefinition(data, options, actualChildren)
}
