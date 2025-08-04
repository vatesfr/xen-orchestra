import type { MaybeRef } from '@vueuse/core'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import type { ComputedRef, EffectScope, Ref, ToRef } from 'vue'

export type ResourceContext<TArgs extends any[]> = {
  scope: EffectScope
  args: { [K in keyof TArgs]: MaybeRefOrGetter<TArgs[K]> }
  isReady: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  lastError: ComputedRef<Error | undefined>
  isEnabled: Ref<boolean>
  enable: () => void
  disable: () => void
  forceReload: () => void
}

export type UseRemoteResource<TState, TArgs extends any[]> = (
  optionsOrParentContext?: {
    isEnabled?: MaybeRef<boolean>
    scope?: EffectScope
  },
  ...args: { [K in keyof TArgs]: MaybeRefOrGetter<TArgs[K]> }
) => {
  [K in keyof TState]: TState[K] extends (...args: any[]) => any ? TState[K] : ToRef<TState[K]>
} & {
  $context: ResourceContext<TArgs>
}
