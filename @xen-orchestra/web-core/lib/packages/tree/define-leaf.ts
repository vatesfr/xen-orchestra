import { LeafDefinition } from '@core/packages/tree/leaf-definition'
import type { Identifiable, Labeled, TreeNodeOptions } from '@core/packages/tree/types'

export function defineLeaf<TData extends Identifiable & Labeled, const TDiscriminator>(
  treeId: string,
  data: TData
): LeafDefinition<TData, TDiscriminator>

export function defineLeaf<TData extends object, const TDiscriminator>(
  treeId: string,
  data: TData,
  options: TreeNodeOptions<TData, TDiscriminator>
): LeafDefinition<TData, TDiscriminator>

export function defineLeaf<TData extends object, const TDiscriminator>(
  treeId: string,
  data: TData,
  options?: TreeNodeOptions<TData, TDiscriminator>
): LeafDefinition<TData, TDiscriminator> {
  return new LeafDefinition(treeId, data, options ?? ({} as TreeNodeOptions<TData, TDiscriminator>))
}
