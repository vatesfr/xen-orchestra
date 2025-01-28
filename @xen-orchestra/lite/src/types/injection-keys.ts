import type { FetchedStats, Stat } from '@/composables/fetch-stats.composable'
import type { HostStats, VmStats } from '@/libs/xapi-stats'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import type { ModalController } from '@/types/index'
import type { ComputedRef, InjectionKey } from 'vue'

export const IK_INPUT_TYPE = Symbol('IK_INPUT_TYPE') as InjectionKey<'select' | 'textarea'>

export const IK_CHECKBOX_TYPE = Symbol('IK_CHECKBOX_TYPE') as InjectionKey<'checkbox' | 'radio' | 'toggle'>

export const IK_FORM_HAS_LABEL = Symbol('IK_FORM_HAS_LABEL') as InjectionKey<ComputedRef<boolean>>

export const IK_HOST_STATS = Symbol('IK_HOST_STATS') as InjectionKey<ComputedRef<Stat<HostStats>[]>>

export const IK_VM_STATS = Symbol('IK_VM_STATS') as InjectionKey<ComputedRef<Stat<VmStats>[]>>

export const IK_HOST_LAST_WEEK_STATS = Symbol('IK_HOST_LAST_WEEK_STATS') as InjectionKey<
  FetchedStats<XenApiHost, HostStats>
>

export const IK_BUTTON_GROUP_OUTLINED = Symbol('IK_BUTTON_GROUP_OUTLINED') as InjectionKey<ComputedRef<boolean>>

export const IK_BUTTON_GROUP_TRANSPARENT = Symbol('IK_BUTTON_GROUP_TRANSPARENT') as InjectionKey<ComputedRef<boolean>>

export const IK_CARD_GROUP_VERTICAL = Symbol('IK_CARD_GROUP_VERTICAL') as InjectionKey<boolean>

export const IK_INPUT_ID = Symbol('IK_INPUT_ID') as InjectionKey<ComputedRef<string>>

export const IK_MODAL_CLOSE = Symbol('IK_MODAL_CLOSE') as InjectionKey<() => void>

export const IK_MODAL_NESTED = Symbol('IK_MODAL_NESTED') as InjectionKey<boolean>

export const IK_MODAL = Symbol('IK_MODAL') as InjectionKey<ModalController>
