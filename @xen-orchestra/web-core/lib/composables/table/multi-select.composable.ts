import { computed, ref, unref, type MaybeRef, type Ref } from 'vue'

export default function useMultiSelect<T>(usableIds: MaybeRef<T[]>, selectableIds?: MaybeRef<T[]>) {
  const $selected = ref(new Set()) as Ref<Set<T>>

  const selected = computed({
    get() {
      return unref(usableIds).filter(usableId => $selected.value.has(usableId))
    },
    set(ids: T[]) {
      $selected.value = new Set(ids)
    },
  })

  const areAllSelected = computed({
    get() {
      return (unref(selectableIds) ?? unref(usableIds)).every(id => $selected.value.has(id))
    },
    set(value: boolean) {
      if (value) {
        $selected.value = new Set(unref(selectableIds) ?? unref(usableIds))
      } else {
        $selected.value = new Set()
      }
    },
  })

  return {
    selected,
    areAllSelected,
  }
}
