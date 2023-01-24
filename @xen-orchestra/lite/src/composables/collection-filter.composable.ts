import { getFirst } from "@/libs/utils";
import * as CM from "complex-matcher";
import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRoute, useRouter } from "vue-router";

interface Config {
  queryStringParam?: string;
  initialFilters?: string[];
}

export default function useCollectionFilter<T>(config: Config = {}) {
  const route = useRoute();
  const router = useRouter();
  const { queryStringParam, initialFilters = [] } = config;
  const filtersSet = ref<Set<string>>(new Set(initialFilters));
  const filters = computed(() => Array.from(filtersSet.value.values()));

  if (queryStringParam !== undefined) {
    const queryString = route.query[queryStringParam];

    if (queryString !== undefined) {
      filtersSet.value = queryToSet(getFirst(queryString));
    }

    watch(filters, (value) =>
      router.replace({
        query: { ...route.query, [queryStringParam]: value.join(" ") },
      })
    );
  }

  const addFilter = (filter: string) => {
    filtersSet.value.add(filter);
  };

  const removeFilter = (filter: string) => {
    filtersSet.value.delete(filter);
  };

  const predicate = computed<(value: T) => boolean>(() => {
    return CM.parse(
      Array.from(filters.value.values()).join(" ")
    ).createPredicate();
  });

  return {
    filters,
    addFilter,
    removeFilter,
    predicate,
  };
}

function queryToSet(query?: LocationQueryValue): Set<string> {
  if (!query) {
    return new Set();
  }

  const rootNode = CM.parse(query);

  if (rootNode instanceof CM.And) {
    return new Set(rootNode.children.map((child) => child.toString()));
  } else {
    return new Set([rootNode.toString()]);
  }
}
