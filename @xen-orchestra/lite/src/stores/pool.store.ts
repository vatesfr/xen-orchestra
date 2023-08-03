import { getFirst } from "@/libs/utils";
import type { XenApiPool } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import type {
  Extension,
  Options,
  PartialSubscription,
  Subscription,
  XenApiRecordExtension,
} from "@/types/subscription";
import { defineStore } from "pinia";
import { computed, type ComputedRef } from "vue";

type PoolExtension = Extension<{
  pool: ComputedRef<XenApiPool | undefined>;
}>;

type Extensions = [XenApiRecordExtension<XenApiPool>, PoolExtension];

export const usePoolStore = defineStore("pool", () => {
  const poolCollection = useXapiCollectionStore().get("pool");
  const subscribe = <O extends Options<Extensions>>(options?: O) => {
    const subscription = poolCollection.subscribe(options);

    const extendedSubscription: PartialSubscription<PoolExtension> = {
      pool: computed(() => getFirst(subscription.records.value)),
    };

    return {
      ...subscription,
      ...extendedSubscription,
    } as Subscription<Extensions, O>;
  };

  return {
    ...poolCollection,
    subscribe,
  };
});
