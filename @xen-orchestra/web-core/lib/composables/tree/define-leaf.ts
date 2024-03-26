import { LeafDefinition } from '@core/composables/tree/leaf-definition'
import type { Identifiable, TreeNodeOptions, Labeled } from '@core/composables/tree/types'

export function defineLeaf<T extends Identifiable & Labeled, const TDiscriminator>(
  data: T
): LeafDefinition<T, TDiscriminator>
export function defineLeaf<T extends object, const TDiscriminator>(
  data: T,
  options: TreeNodeOptions<T, TDiscriminator>
): LeafDefinition<T, TDiscriminator>
export function defineLeaf<T extends object, const TDiscriminator>(
  data: T,
  options?: TreeNodeOptions<T, TDiscriminator>
): LeafDefinition<T, TDiscriminator> {
  return new LeafDefinition(data, options ?? ({} as TreeNodeOptions<T, TDiscriminator>))
}
