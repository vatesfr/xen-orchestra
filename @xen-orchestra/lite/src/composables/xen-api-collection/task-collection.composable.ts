import useArrayRemovedItemsHistory from "@/composables/array-removed-items-history.composable";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";
import { useXenApiCollection } from "@/composables/xen-api-collection.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import type { XenApiTask } from "@/libs/xen-api";

export const useTaskCollection = () => {
  const collection = useXenApiCollection("task");

  const { compareFn } = useCollectionSorter<XenApiTask>({
    initialSorts: ["-created"],
  });

  const { predicate } = useCollectionFilter({
    initialFilters: [
      "!name_label:|(SR.scan host.call_plugin)",
      "status:pending",
    ],
  });

  const sortedTasks = useSortedCollection(collection.records, compareFn);

  return {
    ...collection,
    pendingTasks: useFilteredCollection<XenApiTask>(sortedTasks, predicate),
    finishedTasks: useArrayRemovedItemsHistory(
      sortedTasks,
      (task) => task.uuid,
      {
        limit: 50,
        onRemove: (tasks) =>
          tasks.map((task) => ({
            ...task,
            finished: new Date().toISOString(),
          })),
      }
    ),
  };
};
