import { computed, unref } from "vue";
import type { MaybeRef } from "@vueuse/core";

export default function useFilteredCollection<T>(
  collection: MaybeRef<T[]>,
  predicate: MaybeRef<(value: T) => boolean>
) {
  const filteredCollection = computed(() => {
    return unref(collection).filter(unref(predicate));
  });

  return filteredCollection;
}
