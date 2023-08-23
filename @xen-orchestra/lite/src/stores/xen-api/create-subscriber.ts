import { type StoreDefinition, storeToRefs } from "pinia";
import { computed, type ComputedRef, onUnmounted, type ToRefs } from "vue";

type Subscriber<
  D extends StoreDefinition,
  State = D extends StoreDefinition<any, infer State> ? State : never,
  Getters = D extends StoreDefinition<any, any, infer Getters>
    ? Getters
    : never,
  Actions = D extends StoreDefinition<any, any, any, infer Actions>
    ? Actions
    : never,
> = <Defer extends boolean = false>(options?: {
  defer?: Defer;
}) => Omit<
  ToRefs<State> & Getters & Actions,
  | "subscribe"
  | "unsubscribe"
  | "hasSubscriptions"
  | "$id"
  | "$reset"
  | "$patch"
  | "$state"
  | "$dispose"
  | "$subscribe"
  | "_customProperties"
  | "$onAction"
> &
  (Defer extends true
    ? { start: () => void; isStarted: ComputedRef<boolean> }
    : object);

export const createSubscriber = <D extends StoreDefinition>(
  useStore: D
): Subscriber<D> => {
  return (<Defer extends boolean>(options: { defer?: Defer } = {}) => {
    const store = useStore();
    const id = Symbol();
    onUnmounted(() => store.unsubscribe(id));

    const start = () => store.subscribe(id);

    if (options.defer) {
      return {
        ...store,
        ...storeToRefs(store),
        start,
        isStarted: computed(() => store.hasSubscriptions),
      };
    }

    start();

    return {
      ...store,
      ...storeToRefs(store),
    };
  }) as unknown as Subscriber<D>;
};
