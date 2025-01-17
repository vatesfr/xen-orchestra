import type { ComputedRef, InjectionKey, Ref } from 'vue'

export const IK_TREE_ITEM_HAS_CHILDREN = Symbol('IK_TREE_ITEM_HAS_CHILDREN') as InjectionKey<Ref<boolean>>

export const IK_TREE_ITEM_TOGGLE = Symbol('IK_TREE_ITEM_TOGGLE') as InjectionKey<(force?: boolean) => void>

export const IK_TREE_ITEM_EXPANDED = Symbol('IK_TREE_ITEM_EXPANDED') as InjectionKey<Ref<boolean>>

export const IK_TREE_LIST_DEPTH = Symbol('IK_TREE_LIST_DEPTH') as InjectionKey<number>

export const IK_DROPDOWN_CHECKBOX = Symbol('IK_DROPDOWN_CHECKBOX') as InjectionKey<ComputedRef<boolean>>

export const IK_MENU_HORIZONTAL = Symbol('IK_MENU_HORIZONTAL') as InjectionKey<ComputedRef<boolean>>

export const IK_CLOSE_MENU = Symbol('IK_CLOSE_MENU') as InjectionKey<() => void>

export const IK_MENU_TELEPORTED = Symbol('IK_MENU_TELEPORTED') as InjectionKey<boolean>

export const IK_DISABLED = Symbol('IK_DISABLED') as InjectionKey<ComputedRef<boolean>>
