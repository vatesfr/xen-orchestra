import { computed, type MaybeRefOrGetter, ref, toValue, watch } from "vue";

type SubscriberOptions = {
  onSubscriptionStart?: () => void;
  onSubscriptionEnd?: () => void;
  enabled?: MaybeRefOrGetter<boolean>;
};

export const useSubscriber = ({
  onSubscriptionStart,
  onSubscriptionEnd,
  enabled,
}: SubscriberOptions = {}) => {
  const subscribers = ref(new Set<symbol>());

  const hasSubscribers = computed(() => subscribers.value.size > 0);

  const subscribe = (id: symbol) => {
    subscribers.value.add(id);
  };

  const unsubscribe = (id: symbol) => {
    subscribers.value.delete(id);
  };

  watch(
    () => hasSubscribers.value && toValue(enabled),
    (hasSubscribers) => {
      if (hasSubscribers) {
        onSubscriptionStart?.();
      } else {
        onSubscriptionEnd?.();
      }
    }
  );

  return {
    subscribe,
    unsubscribe,
    hasSubscribers,
  };
};

export type Subscriber = ReturnType<typeof useSubscriber>;
