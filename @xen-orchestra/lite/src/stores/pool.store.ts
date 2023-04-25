import { getFirst } from "@/libs/utils";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";
import { computed } from "vue";

export const usePoolStore = defineStore("pool", () => {
  const poolCollection = useXapiCollectionStore().get("pool");

  const subscribe = () => {
    const subscription = poolCollection.subscribe();

    const pool = computed(() => getFirst(subscription.records.value));

    return {
      ...subscription,
      pool,
    };
  };

  return {
    ...poolCollection,
    subscribe,
  };
});
