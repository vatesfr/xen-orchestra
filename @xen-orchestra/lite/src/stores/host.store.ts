import { sortRecordsByNameLabel } from "@/libs/utils";
import type { HostExtensions } from "@/stores/host.extension";
import {
  getStatsSubscription,
  runningHostsSubscription,
} from "@/stores/host.extension";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import type { Options, Subscription } from "@/types/subscription";
import { defineStore } from "pinia";

export const useHostStore = defineStore("host", () => {
  const hostCollection = useXapiCollectionStore().get("host");

  hostCollection.setSort(sortRecordsByNameLabel);

  const subscribe = <O extends Options<HostExtensions>>(options?: O) => {
    const subscription = hostCollection.subscribe(options);
    const { hostMetricsSubscription } = options ?? {};

    return {
      ...subscription,
      ...getStatsSubscription(subscription),
      ...runningHostsSubscription(subscription, hostMetricsSubscription),
    } as Subscription<HostExtensions, O>;
  };

  return {
    ...hostCollection,
    subscribe,
  };
});
