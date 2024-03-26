import { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Definition, Identifiable, TreeNodeOptions, Labeled } from '@core/composables/tree/types'

export function defineBranch<
  T extends Identifiable & Labeled,
  TChildDefinition extends Definition,
  const TDiscriminator,
>(data: T, children: TChildDefinition[]): BranchDefinition<T, TChildDefinition, TDiscriminator>
export function defineBranch<T extends object, TChildDefinition extends Definition, const TDiscriminator>(
  data: T,
  options: TreeNodeOptions<T, TDiscriminator>,
  children: TChildDefinition[]
): BranchDefinition<T, TChildDefinition, TDiscriminator>
export function defineBranch<T extends object, TChildDefinition extends Definition, const TDiscriminator>(
  data: T,
  optionsOrChildren: TreeNodeOptions<T, TDiscriminator> | TChildDefinition[],
  children?: TChildDefinition[]
): BranchDefinition<T, TChildDefinition, TDiscriminator> {
  const options = Array.isArray(optionsOrChildren) ? ({} as TreeNodeOptions<T, TDiscriminator>) : optionsOrChildren
  const actualChildren = Array.isArray(optionsOrChildren) ? optionsOrChildren : children!

  return new BranchDefinition(data, options, actualChildren)
}
