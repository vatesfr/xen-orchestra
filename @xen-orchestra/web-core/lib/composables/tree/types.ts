import type { Branch } from '@core/composables/tree/branch'
import type { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Leaf } from '@core/composables/tree/leaf'
import type { LeafDefinition } from '@core/composables/tree/leaf-definition'

export type Identifiable = { id: string | number }

export type Labeled = { label: string }

type AcceptableKeys<TData, TAccepted> = {
  [K in keyof TData]: TData[K] extends TAccepted ? K : never
}[keyof TData]

type AcceptableGetter<TData, TAccepted> = AcceptableKeys<TData, TAccepted> | ((data: TData) => TAccepted)

export type BaseTreeNodeOptions<TData, TDiscriminator> = {
  discriminator?: TDiscriminator
  predicate?: (data: TData) => boolean | undefined
  activable?: boolean
}

type GetIdOption<TData extends object> = TData extends Identifiable
  ? { getId?: AcceptableGetter<TData, string | number> }
  : { getId: AcceptableGetter<TData, string | number> }

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

export type TreeNode = Leaf | Branch

export type TreeContext<TTreeNode extends TreeNode = TreeNode> = {
  allowMultiSelect: boolean
  selectedNodes: Map<string | number, TTreeNode>
  expandedNodes: Map<string | number, TTreeNode>
  activeNode: TTreeNode | undefined
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
