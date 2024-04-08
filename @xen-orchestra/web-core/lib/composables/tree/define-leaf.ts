import { LeafDefinition } from '@core/composables/tree/leaf-definition'
import type { Identifiable, Labeled, TreeNodeOptions } from '@core/composables/tree/types'

export function defineLeaf<TData extends Identifiable & Labeled, const TDiscriminator>(
  data: TData
): LeafDefinition<TData, TDiscriminator>
export function defineLeaf<TData extends object, const TDiscriminator>(
  data: TData,
  options: TreeNodeOptions<TData, TDiscriminator>
): LeafDefinition<TData, TDiscriminator>
export function defineLeaf<TData extends object, const TDiscriminator>(
  data: TData,
  options?: TreeNodeOptions<TData, TDiscriminator>
): LeafDefinition<TData, TDiscriminator> {
  return new LeafDefinition(data, options ?? ({} as TreeNodeOptions<TData, TDiscriminator>))
}
