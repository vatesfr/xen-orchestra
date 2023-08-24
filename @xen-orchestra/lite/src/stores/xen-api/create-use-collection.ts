import { type StoreDefinition, storeToRefs } from "pinia";
import { computed, type ComputedRef, onUnmounted, type ToRefs } from "vue";

type Output<
  UseStore extends StoreDefinition,
  Defer extends boolean,
> = UseStore extends StoreDefinition<
  string,
  infer State,
  infer Getters,
  infer Actions
>
  ? Omit<
      ToRefs<State> & Getters & Actions,
      "add" | "remove" | "subscribe" | "hasSubscribers" | "unsubscribe"
    > &
      (Defer extends true
        ? { start: () => void; isStarted: ComputedRef<boolean> }
        : object)
  : never;

type SubscribableStore = StoreDefinition<
  string,
  any,
  any,
  {
    subscribe: (id: symbol) => void;
    unsubscribe: (id: symbol) => void;
    hasSubscribers: boolean;
  }
>;

export const createUseCollection = <UseStore extends SubscribableStore>(
  useStore: UseStore
) => {
  return <Defer extends boolean>(options?: {
    defer: Defer;
  }): Output<UseStore, Defer> => {
    const store = useStore();

    const id = Symbol();
    onUnmounted(() => store.unsubscribe(id));
    const start = () => store.subscribe(id);

    if (options?.defer) {
      return {
        ...store,
        ...storeToRefs(store),
        start,
        isStarted: computed(() => store.hasSubscribers),
      } as unknown as Output<UseStore, Defer>;
    }

    start();

    return {
      ...store,
      ...storeToRefs(store),
    } as unknown as Output<UseStore, Defer>;
  };
};
