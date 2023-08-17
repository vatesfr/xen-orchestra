import type { GetStats } from "@/composables/fetch-stats.composable";
import { useXenApiCollection } from "@/composables/xen-api-collection.composable";
import { useHostMetricsCollection } from "@/composables/xen-api-collection/host-metrics-collection.composable";
import type { XenApiHost } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import { computed } from "vue";

export const useHostCollection = () => {
  const collection = useXenApiCollection("host");
  const hostMetricsCollection = useHostMetricsCollection();

  return {
    ...collection,
    runningHosts: computed(() =>
      collection.records.value.filter((host) =>
        hostMetricsCollection.isHostRunning(host)
      )
    ),
    getStats: ((
      hostUuid,
      granularity,
      ignoreExpired = false,
      { abortSignal }
    ) => {
      const xenApiStore = useXenApiStore();
      const host = collection.getByUuid(hostUuid);

      if (host === undefined) {
        throw new Error(`Host ${hostUuid} could not be found.`);
      }

      const xapiStats = xenApiStore.isConnected
        ? xenApiStore.getXapiStats()
        : undefined;

      return xapiStats?._getAndUpdateStats({
        abortSignal,
        host,
        ignoreExpired,
        uuid: host.uuid,
        granularity,
      });
    }) as GetStats<XenApiHost>,
  };
};
