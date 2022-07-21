import { computed, ref, unref } from "vue";
import type { MaybeRef } from "@vueuse/core";

export default function useSortable<T>(data: MaybeRef<T[]>) {
  const sortProperty = ref<keyof T>();
  const sortAscending = ref(true);
  const sortBy = (property: keyof T) => {
    if (sortProperty.value !== property) {
      sortProperty.value = property;
      sortAscending.value = true;
    } else if (sortAscending.value) {
      sortAscending.value = !sortAscending.value;
    } else {
      sortAscending.value = true;
      sortProperty.value = undefined;
    }
  };
  const isSortedBy = (property: keyof T) => {
    return sortProperty.value === property;
  };
  const isAscending = computed(() => sortAscending.value === true);
  const records = computed(() => {
    let records = [...unref(data)];

    if (sortProperty.value) {
      records = records.sort((record1, record2) => {
        const value1 = record1[sortProperty.value!];
        const value2 = record2[sortProperty.value!];
        switch (true) {
          case value1 < value2:
            return sortAscending.value ? -1 : 1;
          case value1 > value2:
            return sortAscending.value ? 1 : -1;
          default:
            return 0;
        }
      });
    }

    return records;
  });

  return {
    sortBy,
    records,
    isAscending,
    isSortedBy,
  };
}
