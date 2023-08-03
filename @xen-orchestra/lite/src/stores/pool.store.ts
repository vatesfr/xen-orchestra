import { getFirst } from "@/libs/utils";
import type { XenApiPool } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { createSubscribe } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { computed, type ComputedRef } from "vue";

type PoolExtension = {
  pool: ComputedRef<XenApiPool | undefined>;
};

type Extensions = [PoolExtension];

export const usePoolStore = defineStore("pool", () => {
  const poolCollection = useXapiCollectionStore().get("pool");

  const subscribe = createSubscribe<"pool", Extensions>((options) => {
    const originalSubscription = poolCollection.subscribe(options);

    const extendedSubscription = {
      pool: computed(() => getFirst(originalSubscription.records.value)),
    };

    return {
      ...originalSubscription,
      ...extendedSubscription,
    };
  });

  return {
    ...poolCollection,
    subscribe,
  };
});
