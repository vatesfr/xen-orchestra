import * as CM from "complex-matcher";
import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRoute, useRouter } from "vue-router";

interface Config {
  queryStringParam?: string;
}

export default function useCollectionFilter(
  config: Config = { queryStringParam: "filter" }
) {
  const route = useRoute();
  const router = useRouter();
  const filtersSet = ref(
    config.queryStringParam
      ? queryToSet(route.query[config.queryStringParam] as LocationQueryValue)
      : new Set<string>()
  );
  const filters = computed(() => Array.from(filtersSet.value.values()));

  if (config.queryStringParam) {
    const queryStringParam = config.queryStringParam;
    watch(filters, (value) => {
      router.replace({ query: { [queryStringParam]: value.join(" ") } });
    });
  }

  const addFilter = (filter: string) => {
    filtersSet.value.add(filter);
  };

  const removeFilter = (filter: string) => {
    filtersSet.value.delete(filter);
  };

  const predicate = computed(() => {
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

function queryToSet(filter: LocationQueryValue): Set<string> {
  if (filter) {
    return new Set(filter.split(" "));
  }

  return new Set();
}
