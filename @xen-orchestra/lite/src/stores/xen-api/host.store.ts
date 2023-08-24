import type { GetStats } from "@/composables/fetch-stats.composable";
import { useXenApiStoreSubscribableContext } from "@/composables/xen-api-store-subscribable-context";
import type { XenApiHost } from "@/libs/xen-api/xen-api.types";
import { useXenApiStore } from "@/stores/xen-api.store";
import { createUseCollection } from "@/stores/xen-api/create-use-collection";
import { useHostMetricsStore } from "@/stores/xen-api/host-metrics.store";
import { defineStore } from "pinia";
import { computed } from "vue";

export const useHostStore = defineStore("xen-api-host", () => {
  const context = useXenApiStoreSubscribableContext("host");
  const hostMetricsStore = useHostMetricsStore();

  const runningHosts = computed(() =>
    context.records.value.filter((host) => hostMetricsStore.isHostRunning(host))
  );

  const getStats = ((
    hostUuid,
    granularity,
    ignoreExpired = false,
    { abortSignal }
  ) => {
    const xenApiStore = useXenApiStore();
    const host = context.getByUuid(hostUuid);

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
  }) as GetStats<XenApiHost>;

  return {
    ...context,
    runningHosts,
    getStats,
  };
});

export const useHostCollection = createUseCollection(useHostStore);
