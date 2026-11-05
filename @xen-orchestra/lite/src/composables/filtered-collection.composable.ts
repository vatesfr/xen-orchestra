import { computed, unref, type MaybeRef } from 'vue'

export default function useFilteredCollection<T>(
  collection: MaybeRef<T[]>,
  predicate: MaybeRef<(value: T) => boolean>
) {
  return computed(() => {
    return unref(collection).filter(unref(predicate))
  })
}
