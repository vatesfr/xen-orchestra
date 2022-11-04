import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRoute, useRouter } from "vue-router";
import type { ActiveSorts } from "@/types/sort";

interface Config {
  queryStringParam?: string;
}

export default function useCollectionSorter(
  config: Config = { queryStringParam: "sort" }
) {
  const route = useRoute();
  const router = useRouter();

  const sorts = ref<ActiveSorts>(
    config.queryStringParam
      ? queryToMap(route.query[config.queryStringParam] as LocationQueryValue)
      : new Map()
  );

  if (config.queryStringParam) {
    const queryStringParam = config.queryStringParam;
    watch(
      sorts,
      (value) =>
        router.replace({
          query: {
            ...route.query,
            [queryStringParam]: Array.from(value)
              .map(
                ([property, isAscending]) =>
                  `${property}:${isAscending ? "1" : "0"}`
              )
              .join(","),
          },
        }),
      { deep: true }
    );
  }

  const addSort = (property: string, isAscending: boolean) => {
    sorts.value.set(property, isAscending);
  };

  const removeSort = (property: string) => {
    sorts.value.delete(property);
  };

  const toggleSortDirection = (property: string) => {
    if (!sorts.value.has(property)) {
      return;
    }

    sorts.value.set(property, !sorts.value.get(property));
  };

  const compareFn = computed(() => {
    return (record1: any, record2: any) => {
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
