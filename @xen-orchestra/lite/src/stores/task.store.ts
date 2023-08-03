import {
  additionalTasksSubscription,
  type TaskExtensions,
} from "@/stores/task.extension";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import type { Options, Subscription } from "@/types/subscription";
import { defineStore } from "pinia";

export const useTaskStore = defineStore("task", () => {
  const tasksCollection = useXapiCollectionStore().get("task");

  const subscribe = <O extends Options<TaskExtensions>>(options?: O) => {
    const subscription = tasksCollection.subscribe(options);

    return {
      ...subscription,
      ...additionalTasksSubscription(subscription),
    } as Subscription<TaskExtensions, O>;
  };

  return { ...tasksCollection, subscribe };
});
