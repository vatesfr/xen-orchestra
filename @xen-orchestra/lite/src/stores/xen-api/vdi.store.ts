import { useXenApiStoreSubscribableContext } from "@/composables/xen-api-store-subscribable-context.composable";
import { createUseCollection } from "@/stores/xen-api/create-use-collection";
import { defineStore } from "pinia";
import type { XenApiVdi } from "@/libs/xen-api/xen-api.types";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";


export const useVdiStore = defineStore("xen-api-vdi", () => {
  const context = useXenApiStoreSubscribableContext("vdi");

    const { compareFn } = useCollectionSorter<XenApiVdi>({
    initialSorts: ["-name_label"],
  });

  const sortedVdis = useSortedCollection(context.records, compareFn);

  const { predicate } = useCollectionFilter({
    initialFilters: [
      //"!is_a_snapshot?",
      "!is_tools_iso?",
    ],
  });

  const filteredrecords = useFilteredCollection<XenApiVdi>(
    sortedVdis,
    predicate
  );

  return {
    ...context,
    filteredrecords
  };
});

export const useVdiCollection = createUseCollection(useVdiStore);