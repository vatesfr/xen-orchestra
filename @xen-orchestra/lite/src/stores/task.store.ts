import useArrayRemovedItemsHistory from "@/composables/array-removed-items-history.composable";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import type { XenApiTask } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { createSubscribe } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import type { ComputedRef, Ref } from "vue";

type PendingTasksExtension = {
  pendingTasks: ComputedRef<XenApiTask[]>;
};

type FinishedTasksExtension = {
  finishedTasks: Ref<XenApiTask[]>;
};

type Extensions = [PendingTasksExtension, FinishedTasksExtension];

export const useTaskStore = defineStore("task", () => {
  const tasksCollection = useXapiCollectionStore().get("task");

  const subscribe = createSubscribe<XenApiTask, Extensions>(() => {
    const subscription = tasksCollection.subscribe();

    const { compareFn } = useCollectionSorter<XenApiTask>({
      initialSorts: ["-created"],
    });

    const sortedTasks = useSortedCollection(subscription.records, compareFn);

    const { predicate } = useCollectionFilter({
      initialFilters: [
        "!name_label:|(SR.scan host.call_plugin)",
        "status:pending",
      ],
    });

    const extendedSubscription = {
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

    return {
      ...subscription,
      ...extendedSubscription,
    };
  });

  return { ...tasksCollection, subscribe };
});
