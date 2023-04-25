import {
  isHostRunning,
  requireSubscription,
  sortRecordsByNameLabel,
} from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiHostMetrics } from "@/libs/xen-api";
import {
  type CollectionSubscription,
  useXapiCollectionStore,
} from "@/stores/xapi-collection.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { defineStore } from "pinia";
import { computed } from "vue";

type SubscribeOptions = {
  hostMetricsSubscription?: CollectionSubscription<XenApiHostMetrics>;
};

export const useHostStore = defineStore("host", () => {
  const xenApiStore = useXenApiStore();
  const hostCollection = useXapiCollectionStore().get("host");

  hostCollection.setSort(sortRecordsByNameLabel);

  const subscribe = ({ hostMetricsSubscription }: SubscribeOptions = {}) => {
    const hostSubscription = hostCollection.subscribe();

    const runningHosts = computed(() => {
      requireSubscription(hostMetricsSubscription, "host_metrics");

      return hostSubscription.records.value.filter((host) =>
        isHostRunning(host, hostMetricsSubscription)
      );
    });

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

    return {
      ...hostSubscription,
      runningHosts,
      getStats,
    };
  };

  return {
    ...hostCollection,
    subscribe,
  };
});
