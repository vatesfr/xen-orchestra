import type { GetStats } from "@/composables/fetch-stats.composable";
import type { XenApiHost } from "@/libs/xen-api/xen-api.types";
import { useXenApiStore } from "@/stores/xen-api.store";
import { useHostMetricsStore } from "@/stores/xen-api/host-metrics.store";
import { createXenApiStore } from "@/stores/xen-api/create-store";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { defineStore } from "pinia";
import { computed } from "vue";

export const useHostStore = defineStore("xen-api-host", () => {
  const baseStore = createXenApiStore("host");
  const hostMetricsStore = useHostMetricsStore();

  const runningHosts = computed(() =>
    baseStore.records.value.filter((host) =>
      hostMetricsStore.isHostRunning(host)
    )
  );

  const getStats = ((
    hostUuid,
    granularity,
    ignoreExpired = false,
    { abortSignal }
  ) => {
    const xenApiStore = useXenApiStore();
    const host = baseStore.getByUuid(hostUuid);

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
    ...baseStore,
    runningHosts,
    getStats,
  };
});

export const useHostCollection = createSubscriber(useHostStore);
