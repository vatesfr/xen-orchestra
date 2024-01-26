import type { ComputedRef, InjectionKey, Ref } from 'vue'

export const IK_LIST_ITEM_HAS_CHILDREN = Symbol('IK_LIST_ITEM_HAS_CHILDREN') as InjectionKey<ComputedRef<boolean>>

export const IK_LIST_ITEM_TOGGLE = Symbol('IK_LIST_ITEM_TOGGLE') as InjectionKey<(force?: boolean) => void>

export const IK_LIST_ITEM_EXPANDED = Symbol('IK_LIST_ITEM_EXPANDED') as InjectionKey<Ref<boolean>>
