import type { PiniaCustomStateProperties, Store, StoreDefinition, StoreGetters, StoreState } from 'pinia'
import { storeToRefs } from 'pinia'
import type { ComputedRef, Ref, ToRef, ToRefs } from 'vue'
import { computed, onUnmounted } from 'vue'

type IgnoredProperties =
  | '_customProperties'
  | '$id'
  | '$dispose'
  | '$state'
  | '$patch'
  | '$reset'
  | '$subscribe'
  | '$unsubscribe'
  | '$onAction'
  | 'add'
  | 'remove'
  | 'subscribe'
  | 'hasSubscribers'
  | 'unsubscribe'

type ToComputedRefs<T> = {
  [K in keyof T]: ToRef<T[K]> extends Ref<infer U> ? ComputedRef<U> : ToRef<T[K]>
}

type StoreToRefs<SS extends Store<any, any, any, any>> = ToRefs<
  StoreState<SS> & PiniaCustomStateProperties<StoreState<SS>>
> &
  ToComputedRefs<StoreGetters<SS>>

type Output<S extends StoreDefinition<any, any, any, any>, Defer extends boolean> = Omit<
  S,
  keyof StoreToRefs<S> | IgnoredProperties
> &
  StoreToRefs<S> &
  (Defer extends true ? { start: () => void; isStarted: ComputedRef<boolean> } : object)

export const createUseCollection = <
  SD extends StoreDefinition<any, any, any, any>,
  UseStore extends SD extends StoreDefinition<infer Id, infer S, infer G, infer A> ? Store<Id, S, G, A> : never,
>(
  useStore: SD
) => {
  return <Defer extends boolean>(options?: { defer: Defer }): Output<UseStore, Defer> => {
    const store = useStore()

    const id = Symbol(store.$id)
    onUnmounted(() => store.unsubscribe(id))
    const start = () => store.subscribe(id)

    if (options?.defer) {
      return {
        ...store,
        ...storeToRefs(store),
        start,
        isStarted: computed(() => store.hasSubscribers),
      } as unknown as Output<UseStore, Defer>
    }

    start()

    return {
      ...store,
      ...storeToRefs(store),
    } as unknown as Output<UseStore, Defer>
  }
}
