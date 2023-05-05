import { isHostRunning, sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY, XapiStatsResponse } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiHostMetrics } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import type { CollectionSubscription } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { computed, type ComputedRef } from "vue";

type MetricsSubscription = CollectionSubscription<XenApiHostMetrics>;

interface HostSubscribeOptions<M extends undefined | MetricsSubscription> {
  hostMetricsSubscription?: M;
}

interface HostSubscription extends CollectionSubscription<XenApiHost> {
  getStats: (
    hostUuid: string,
    granularity: GRANULARITY
  ) => Promise<XapiStatsResponse<any>>;
}

interface HostSubscriptionWithRunningHosts extends HostSubscription {
  runningHosts: ComputedRef<XenApiHost[]>;
}

export const useHostStore = defineStore("host", () => {
  const xenApiStore = useXenApiStore();
  const hostCollection = useXapiCollectionStore().get("host");

  hostCollection.setSort(sortRecordsByNameLabel);

  function subscribe(
    options?: HostSubscribeOptions<undefined>
  ): HostSubscription;

  function subscribe(
    options?: HostSubscribeOptions<MetricsSubscription>
  ): HostSubscriptionWithRunningHosts;

  function subscribe({
    hostMetricsSubscription,
  }: HostSubscribeOptions<undefined | MetricsSubscription> = {}) {
    const hostSubscription = hostCollection.subscribe();

    const getStats = (hostUuid: string, granularity: GRANULARITY) => {
      const host = hostSubscription.getByUuid(hostUuid);

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

    const subscription = {
      ...hostSubscription,
      getStats,
    };

    if (hostMetricsSubscription === undefined) {
      return subscription;
    }

    const runningHosts = computed(() =>
      hostSubscription.records.value.filter((host) =>
        isHostRunning(host, hostMetricsSubscription)
      )
    );

    return {
      ...subscription,
      runningHosts,
    };
  }

  return {
    ...hostCollection,
    subscribe,
  };
});
