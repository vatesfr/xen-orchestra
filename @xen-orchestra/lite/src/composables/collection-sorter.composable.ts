import type { ActiveSorts } from "@/types/sort";
import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRoute, useRouter } from "vue-router";

interface Config<T> {
  queryStringParam?: string;
  initialSorts?: [property: keyof T, isAscending: boolean][];
}

export default function useCollectionSorter<T>(config: Config<T> = {}) {
  const route = useRoute();
  const router = useRouter();
  const { queryStringParam, initialSorts = [] } = config;
  const sorts = ref<ActiveSorts<T>>(new Map(initialSorts));

  const sortsAsString = computed(() =>
    Array.from(sorts.value)
      .map(([property, isAsc]) => `${String(property)}:${isAsc ? "1" : "0"}`)
      .join(",")
  );

  if (queryStringParam !== undefined) {
    if (route.query[queryStringParam] !== undefined) {
      sorts.value = queryToMap(
        route.query[queryStringParam] as LocationQueryValue
      );
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

function queryToMap(query: LocationQueryValue) {
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
