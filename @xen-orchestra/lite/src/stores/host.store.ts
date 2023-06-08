import { isHostRunning, sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY, XapiStatsResponse } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiHostMetrics } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import type { Subscription } from "@/types/xapi-collection";
import { createSubscribe } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { computed, type ComputedRef } from "vue";

type GetStatsExtension = {
  getStats: (
    hostUuid: string,
    granularity: GRANULARITY
  ) => Promise<XapiStatsResponse<any>> | undefined;
};

type RunningHostsExtension = [
  { runningHosts: ComputedRef<XenApiHost[]> },
  { hostMetricsSubscription: Subscription<XenApiHostMetrics, any> }
];

type Extensions = [GetStatsExtension, RunningHostsExtension];

export const useHostStore = defineStore("host", () => {
  const xenApiStore = useXenApiStore();
  const hostCollection = useXapiCollectionStore().get("host");

  hostCollection.setSort(sortRecordsByNameLabel);

  const subscribe = createSubscribe<XenApiHost, Extensions>((options) => {
    const originalSubscription = hostCollection.subscribe(options);

    const getStats = (hostUuid: string, granularity: GRANULARITY) => {
      const host = originalSubscription.getByUuid(hostUuid);

      if (host === undefined) {
        throw new Error(`Host ${hostUuid} could not be found.`);
      }

      const xapiStats = xenApiStore.isConnected
        ? xenApiStore.getXapiStats()
        : undefined;

      return xapiStats?._getAndUpdateStats({
        host,
        uuid: host.uuid,
        granularity,
      });
    };

    const extendedSubscription = {
      getStats,
    };

    const hostMetricsSubscription = options?.hostMetricsSubscription;

    const runningHostsSubscription = hostMetricsSubscription !== undefined && {
      runningHosts: computed(() =>
        originalSubscription.records.value.filter((host) =>
          isHostRunning(host, hostMetricsSubscription)
        )
      ),
    };
    return {
      ...originalSubscription,
      ...extendedSubscription,
      ...runningHostsSubscription,
    };
  });

  return {
    ...hostCollection,
    subscribe,
  };
});
