import { LeafDefinition } from '@core/composables/collection/leaf-definition'
import type { Identifiable, ItemOptions, Labeled } from '@core/composables/collection/types'

export function defineLeaf<T extends Identifiable & Labeled, const TDiscriminator>(
  data: T
): LeafDefinition<T, TDiscriminator>
export function defineLeaf<T extends object, const TDiscriminator>(
  data: T,
  options: ItemOptions<T, TDiscriminator>
): LeafDefinition<T, TDiscriminator>
export function defineLeaf<T extends object, const TDiscriminator>(
  data: T,
  options?: ItemOptions<T, TDiscriminator>
): LeafDefinition<T, TDiscriminator> {
  return new LeafDefinition(data, options ?? ({} as ItemOptions<T, TDiscriminator>))
}
