import type { XenApiHost } from "@/libs/xen-api/xen-api.types";
import { createXenApiStore } from "@/stores/xen-api/create-store";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { defineStore } from "pinia";

export const useHostMetricsStore = defineStore("xen-api-host-metrics", () => {
  const baseStore = createXenApiStore("host_metrics");

  const getHostMemory = (host: XenApiHost) => {
    const hostMetrics = baseStore.getByOpaqueRef(host.metrics);

    if (hostMetrics !== undefined) {
      const total = +hostMetrics.memory_total;
      return {
        usage: total - +hostMetrics.memory_free,
        size: total,
      };
    }
  };

  const isHostRunning = (host: XenApiHost) => {
    return baseStore.getByOpaqueRef(host.metrics)?.live === true;
  };

  return {
    ...baseStore,
    getHostMemory,
    isHostRunning,
  };
});

export const useHostMetricsCollection = createSubscriber(useHostMetricsStore);
