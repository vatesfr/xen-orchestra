import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

export type SubscriberDependencies = {
  subscribe: (id: symbol) => void
  unsubscribe: (id: symbol) => void
}[]

export type SubscriberOptions = {
  onSubscriptionStart?: () => void
  onSubscriptionEnd?: () => void
  enabled?: MaybeRefOrGetter<boolean>
  dependencies?: SubscriberDependencies
}

export const useSubscriber = ({
  onSubscriptionStart,
  onSubscriptionEnd,
  enabled = true,
  dependencies,
}: SubscriberOptions = {}) => {
  const subscribers = ref(new Set<symbol>())

  const hasSubscribers = computed(() => subscribers.value.size > 0)

  const subscribe = (id: symbol) => {
    dependencies?.forEach(dependency => dependency.subscribe(id))
    subscribers.value.add(id)
  }

  const unsubscribe = (id: symbol) => {
    dependencies?.forEach(dependency => dependency.unsubscribe(id))
    subscribers.value.delete(id)
  }

  watch(
    () => hasSubscribers.value && toValue(enabled),
    hasSubscribers => {
      if (hasSubscribers) {
        onSubscriptionStart?.()
      } else {
        onSubscriptionEnd?.()
      }
    }
  )

  return {
    subscribe,
    unsubscribe,
    hasSubscribers,
  }
}

export type Subscriber = ReturnType<typeof useSubscriber>
