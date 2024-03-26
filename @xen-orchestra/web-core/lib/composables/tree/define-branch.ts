import { GroupDefinition } from '@core/composables/tree/branch-definition'
import type { Definition, Identifiable, ItemOptions, Labeled } from '@core/composables/tree/types'

export function defineGroup<
  T extends Identifiable & Labeled,
  TChildDefinition extends Definition,
  const TDiscriminator,
>(data: T, children: TChildDefinition[]): GroupDefinition<T, TChildDefinition, TDiscriminator>
export function defineGroup<T extends object, TChildDefinition extends Definition, const TDiscriminator>(
  data: T,
  options: ItemOptions<T, TDiscriminator>,
  children: TChildDefinition[]
): GroupDefinition<T, TChildDefinition, TDiscriminator>
export function defineGroup<T extends object, TChildDefinition extends Definition, const TDiscriminator>(
  data: T,
  optionsOrChildren: ItemOptions<T, TDiscriminator> | TChildDefinition[],
  children?: TChildDefinition[]
): GroupDefinition<T, TChildDefinition, TDiscriminator> {
  const options = Array.isArray(optionsOrChildren) ? ({} as ItemOptions<T, TDiscriminator>) : optionsOrChildren
  const actualChildren = Array.isArray(optionsOrChildren) ? optionsOrChildren : children!

  return new GroupDefinition(data, options, actualChildren)
}
