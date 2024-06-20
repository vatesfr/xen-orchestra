import type { Branch } from '@core/composables/tree/branch'
import type { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Leaf } from '@core/composables/tree/leaf'
import type { LeafDefinition } from '@core/composables/tree/leaf-definition'
import type { TreeNodeBase } from '@core/composables/tree/tree-node-base'
import { useTree } from '@core/composables/tree.composable'

export type TreeNodeId = string | number

export type Identifiable = { id: TreeNodeId }

export type Labeled = { label: string }

type AcceptableKeys<TData, TAccepted> = {
  [K in keyof TData]: TData[K] extends TAccepted ? K : never
}[keyof TData]

type AcceptableGetter<TData, TAccepted> = AcceptableKeys<TData, TAccepted> | ((data: TData) => TAccepted)

export type TreeNode<
  TData extends object = any,
  TChildNode extends TreeNode = TreeNode<any, any>,
  TDiscriminator = any,
> = Leaf<TData, TDiscriminator> | Branch<TData, TChildNode, TDiscriminator>

export type BaseTreeNodeOptions<TData extends object, TDiscriminator> = {
  discriminator?: TDiscriminator
  predicate?: (node: TreeNodeBase<TData, TDiscriminator>) => boolean | undefined
  selectable?: (data: TData) => boolean
  meta?: any
}

type GetIdOption<TData extends object> = TData extends Identifiable
  ? { getId?: AcceptableGetter<TData, TreeNodeId> }
  : { getId: AcceptableGetter<TData, TreeNodeId> }

type GetLabelOption<TData extends object> = TData extends Labeled
  ? { getLabel?: AcceptableGetter<TData, string> }
  : { getLabel: AcceptableGetter<TData, string> }

export type TreeNodeOptions<TData extends object, TDiscriminator> = BaseTreeNodeOptions<TData, TDiscriminator> &
  GetIdOption<TData> &
  GetLabelOption<TData>

export type TreeNodeDefinition = LeafDefinition | BranchDefinition

export type DefinitionToTreeNode<TDefinition> =
  TDefinition extends BranchDefinition<infer TData, infer TChildDefinition, infer TDiscriminator>
    ? Branch<TData, DefinitionToTreeNode<TChildDefinition>, TDiscriminator>
    : TDefinition extends LeafDefinition<infer TData, infer TDiscriminator>
      ? Leaf<TData, TDiscriminator>
      : never

export type ChildTreeGetter<TData extends object, TChildNode extends TreeNode, TDiscriminator> = (
  thisBranch: Branch<TData, TChildNode, TDiscriminator>
) => TChildNode[]

export type ChildTreeDefinitionGetter<TData extends object, TChildDefinition extends TreeNodeDefinition> = (
  data: TData
) => TChildDefinition[]

export type TreeContext = {
  allowMultiSelect: boolean
  selectedIds: Set<TreeNodeId>
  expandedIds: Set<TreeNodeId>
  activeId: TreeNodeId | undefined
}

export type UseTreeOptions = {
  allowMultiSelect?: boolean
  expand?: boolean
  selectedLabel?:
    | ((nodes: TreeNode[]) => string)
    | {
        max: number
        fn: (count: number) => string
      }
}

export type Tree = ReturnType<typeof useTree>

export type LeafStatuses = {
  active: boolean
  selected: boolean
  matches: boolean
}

export type BranchStatuses = LeafStatuses & {
  'selected-partial': boolean
  'selected-full': boolean
  expanded: boolean
}
