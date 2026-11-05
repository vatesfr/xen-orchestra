import type { ComputedRef, InjectionKey } from 'vue'

export const IK_OVERLAY_KEY = Symbol('IK_OVERLAY_KEY') as InjectionKey<ComputedRef<symbol>>
