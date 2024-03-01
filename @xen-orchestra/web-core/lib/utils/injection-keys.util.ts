import type { ComputedRef, InjectionKey, Ref } from 'vue'

export const IK_TREE_ITEM_HAS_CHILDREN = Symbol('IK_TREE_ITEM_HAS_CHILDREN') as InjectionKey<ComputedRef<boolean>>

export const IK_TREE_ITEM_TOGGLE = Symbol('IK_TREE_ITEM_TOGGLE') as InjectionKey<(force?: boolean) => void>

export const IK_TREE_ITEM_EXPANDED = Symbol('IK_TREE_ITEM_EXPANDED') as InjectionKey<Ref<boolean>>

export const IK_TREE_LIST_DEPTH = Symbol('IK_TREE_LIST_DEPTH') as InjectionKey<number>

export const IK_BUTTON_GROUP_OUTLINED = Symbol('IK_BUTTON_GROUP_OUTLINED') as InjectionKey<ComputedRef<boolean>>

export const IK_BUTTON_GROUP_TRANSPARENT = Symbol('IK_BUTTON_GROUP_TRANSPARENT') as InjectionKey<ComputedRef<boolean>>

export const IK_BUTTON_GROUP_UNDERLINED = Symbol('IK_BUTTON_GROUP_UNDERLINED') as InjectionKey<ComputedRef<boolean>>
