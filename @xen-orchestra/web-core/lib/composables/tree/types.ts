import type { Branch } from '@core/composables/tree/branch'
import type { BranchDefinition } from '@core/composables/tree/branch-definition'
import type { Leaf } from '@core/composables/tree/leaf'
import type { LeafDefinition } from '@core/composables/tree/leaf-definition'

export type Identifiable = { id: string | number }

export type Labeled = { label: string }

type AcceptableKeys<T, TAccepted> = {
  [K in keyof T]: T[K] extends TAccepted ? K : never
}[keyof T]

type AcceptableGetter<T, TAccepted> = AcceptableKeys<T, TAccepted> | ((data: T) => TAccepted)

export type BaseOptions<T, TDiscriminator> = {
  discriminator?: TDiscriminator
  predicate?: (data: T) => boolean | undefined
  activable?: boolean
}

type GetIdOption<T extends object> = T extends Identifiable
  ? { getId?: AcceptableGetter<T, string | number> }
  : { getId: AcceptableGetter<T, string | number> }

type GetLabelOption<T extends object> = T extends Labeled
  ? { getLabel?: AcceptableGetter<T, string> }
  : { getLabel: AcceptableGetter<T, string> }

export type TreeNodeOptions<T extends object, TDiscriminator> = BaseOptions<T, TDiscriminator> &
  GetIdOption<T> &
  GetLabelOption<T>

export type Definition = LeafDefinition | BranchDefinition

export type DefinitionToTreeNode<TDefinition> =
  TDefinition extends BranchDefinition<infer T, infer TChildDefinition, infer TDiscriminator>
    ? Branch<T, DefinitionToTreeNode<TChildDefinition>, TDiscriminator>
    : TDefinition extends LeafDefinition<infer T, infer TDiscriminator>
      ? Leaf<T, TDiscriminator>
      : never

export type TreeNode = Leaf | Branch

export type CollectionContext<TTreeNode extends TreeNode = TreeNode> = {
  allowMultiSelect: boolean
  selectedNodes: Map<string | number, TTreeNode>
  expandedNodes: Map<string | number, TTreeNode>
  activeNode: TTreeNode | undefined
}

export type UseCollectionOptions = {
  allowMultiSelect?: boolean
  expand?: boolean
  selectedLabel?:
    | ((nodes: TreeNode[]) => string)
    | {
        max: number
        fn: (count: number) => string
      }
}
