import type { MaybeRefOrGetter, Ref } from 'vue'

export type SubscribeContext<TContext, TDefer extends boolean = false> = TDefer extends true
  ? TContext & {
      deferred: true
      start: () => void
      stop: () => void
      isStarted: Readonly<Ref<boolean>>
    }
  : TContext & { deferred: false }

export type Subscribe<TDefer extends boolean = false> = (options?: {
  defer?: TDefer
}) => SubscribeContext<object, TDefer>

export type SubscribableStoreConfig<TContext> = {
  context: TContext
  onSubscribe?: () => void
  onUnsubscribe?: () => void
  isEnabled?: MaybeRefOrGetter<boolean>
}
