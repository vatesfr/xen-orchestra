import { differenceBy } from "lodash-es";
import { type Ref, ref, unref, watch } from "vue";

export default function useArrayHistory<T>(
  list: Ref<T[]>,
  limit = Infinity,
  iteratee: (item: T) => unknown = (item) => item
) {
  const currentList: Ref<T[]> = ref([]);
  const history: Ref<T[]> = ref([]);

  watch(
    list,
    (updatedList) => {
      currentList.value = [...updatedList];
    },
    { deep: true }
  );

  watch(currentList, (nextList, previousList) => {
    const removedItems = differenceBy(previousList, nextList, iteratee);
    history.value.push(...removedItems);
    const currentLimit = unref(limit);
    if (history.value.length > currentLimit) {
      history.value.slice(-currentLimit);
    }
  });

  return history;
}
