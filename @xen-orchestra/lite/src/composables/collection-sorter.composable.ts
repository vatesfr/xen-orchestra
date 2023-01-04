import { getFirst } from "@/libs/utils";
import type { ActiveSorts, InitialSorts, SortConfig } from "@/types/sort";
import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRoute, useRouter } from "vue-router";

export default function useCollectionSorter<T>(config: SortConfig<T> = {}) {
  const route = useRoute();
  const router = useRouter();
  const { queryStringParam, initialSorts = [] } = config;
  const sorts = ref<ActiveSorts<T>>(parseInitialSorts(initialSorts));

  const sortsAsString = computed(() =>
    Array.from(sorts.value)
      .map(([property, isAsc]) => `${String(property)}:${isAsc ? "1" : "0"}`)
      .join(",")
  );

  if (queryStringParam !== undefined) {
    const queryString = route.query[queryStringParam];

    if (queryString !== undefined) {
      sorts.value = queryToMap(getFirst(queryString));
    }

    watch(sortsAsString, (value) =>
      router.replace({
        query: { ...route.query, [queryStringParam]: value },
      })
    );
  }

  const addSort = (property: keyof T, isAscending: boolean) => {
    sorts.value.set(property, isAscending);
  };

  const removeSort = (property: keyof T) => {
    sorts.value.delete(property);
  };

  const toggleSortDirection = (property: keyof T) => {
    if (!sorts.value.has(property)) {
      return;
    }

    sorts.value.set(property, !sorts.value.get(property));
  };

  const compareFn = computed(() => {
    return (record1: T, record2: T) => {
      for (const [property, isAscending] of sorts.value) {
        const value1 = record1[property];
        const value2 = record2[property];

        if (value1 < value2) {
          return isAscending ? -1 : 1;
        }

        if (value1 > value2) {
          return isAscending ? 1 : -1;
        }
      }

      return 0;
    };
  });

  return {
    sorts,
    addSort,
    removeSort,
    toggleSortDirection,
    compareFn,
  };
}

function queryToMap(query?: LocationQueryValue) {
  if (!query) {
    return new Map();
  }

  return new Map(
    query.split(",").map((sortRaw): [string, boolean] => {
      const [property, isAscending] = sortRaw.split(":");
      return [property, isAscending === "1"];
    })
  );
}

function parseInitialSorts<T>(sorts: InitialSorts<T>): ActiveSorts<T> {
  return new Map(
    sorts.map((sort) => {
      const isDescending = sort.startsWith("-");
      const property = (isDescending ? sort.substring(1) : sort) as keyof T;

      return [property, !isDescending];
    })
  );
}
