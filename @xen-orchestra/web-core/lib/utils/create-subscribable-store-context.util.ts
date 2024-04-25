import type { SubscribableStoreConfig, Subscribe, SubscribeContext } from '@core/types/subscribable-store.type'
import { ifElse } from '@core/utils/if-else.utils'
import { computed, onBeforeUnmount, readonly, type Ref, ref, toValue } from 'vue'

export function createSubscribableStoreContext<TContext>(
  config: SubscribableStoreConfig<TContext>,
  dependsOn: Record<any, { subscribe: Subscribe<boolean> }>
) {
  const subscriptions = ref(new Set()) as Ref<Set<symbol>>
  const hasSubscriptions = computed(() => subscriptions.value.size > 0)

  ifElse(() => toValue(config.isEnabled ?? true) && hasSubscriptions.value, config.onSubscribe, config.onUnsubscribe)

  function subscribe(options?: { defer: false }): SubscribeContext<TContext>
  function subscribe(options: { defer: true }): SubscribeContext<TContext, true>
  function subscribe<TDefer extends boolean = false>(options?: { defer?: TDefer }): SubscribeContext<TContext, TDefer>
  function subscribe<TDefer extends boolean>(options?: { defer?: TDefer }): SubscribeContext<TContext, TDefer> {
    const dependencyStarts = [] as (() => void)[]

    Object.values(dependsOn).forEach(dep => {
      const context = dep.subscribe({ defer: options?.defer })

      if (context.deferred) {
        dependencyStarts.push(context.start)
      }
    })

    const id = Symbol('Store subscription ID')
    const isStarted = ref(false)

    const start = () => {
      isStarted.value = true
      dependencyStarts.forEach(start => start())
      subscriptions.value.add(id)
    }

    onBeforeUnmount(() => subscriptions.value.delete(id))

    if (!options?.defer) {
      start()
      return {
        ...config.context,
        deferred: false,
      } as SubscribeContext<TContext, TDefer>
    }

    return {
      ...config.context,
      deferred: true,
      start,
      isStarted: readonly(isStarted),
    } as SubscribeContext<TContext, TDefer>
  }

  return {
    $context: config.context,
    subscribe,
  }
}
