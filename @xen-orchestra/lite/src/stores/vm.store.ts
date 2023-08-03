import { sortRecordsByNameLabel } from "@/libs/utils";
import {
  getStatsSubscription,
  recordsByHostRefSubscription,
  runningVmsSubscription,
  type VmExtensions,
} from "@/stores/vm.extension";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import type { Options, Subscription } from "@/types/subscription";
import { defineStore } from "pinia";

export const useVmStore = defineStore("vm", () => {
  const vmCollection = useXapiCollectionStore().get("VM");

  vmCollection.setFilter(
    (vm) => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain
  );

  vmCollection.setSort(sortRecordsByNameLabel);

  const subscribe = <O extends Options<VmExtensions>>(options?: O) => {
    const subscription = vmCollection.subscribe(options);

    return {
      ...subscription,
      ...recordsByHostRefSubscription(subscription),
      ...runningVmsSubscription(subscription),
      ...getStatsSubscription(subscription, options?.hostSubscription),
    } as Subscription<VmExtensions, O>;
  };

  return {
    ...vmCollection,
    subscribe,
  };
});
