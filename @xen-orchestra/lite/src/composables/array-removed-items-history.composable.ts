import type { MaybeRef } from "@vueuse/core";
import { differenceBy } from "lodash-es";
import { type Ref, ref, unref, watch } from "vue";

export default function useArrayRemovedItemsHistory<T>(
  list: Ref<T[]>,
  iteratee: (item: T) => unknown = (item) => item,
  options: {
    limit?: MaybeRef<number>;
    onRemove?: (items: T[]) => any[];
  } = {}
) {
  const currentList: Ref<T[]> = ref([]);
  const history: Ref<T[]> = ref([]);
  const { limit = Infinity, onRemove = (items) => items } = options;

  watch(
    list,
    (updatedList) => {
      currentList.value = [...updatedList];
    },
    { deep: true }
  );

  watch(currentList, (nextList, previousList) => {
    const removedItems = differenceBy(previousList, nextList, iteratee);
    history.value.push(...onRemove(removedItems));
    const currentLimit = unref(limit);
    if (history.value.length > currentLimit) {
      history.value = history.value.slice(-currentLimit);
    }
  });

  return history;
}
