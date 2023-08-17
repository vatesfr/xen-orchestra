import { useXenApiCollection } from "@/composables/xen-api-collection.composable";
import type { XenApiHost } from "@/libs/xen-api";

export const useHostMetricsCollection = () => {
  const collection = useXenApiCollection("host_metrics");

  return {
    ...collection,
    getHostMemory: (host: XenApiHost) => {
      const hostMetrics = collection.getByOpaqueRef(host.metrics);

      if (hostMetrics !== undefined) {
        const total = +hostMetrics.memory_total;
        return {
          usage: total - +hostMetrics.memory_free,
          size: total,
        };
      }
    },
    isHostRunning: (host: XenApiHost) => {
      return collection.getByOpaqueRef(host.metrics)?.live === true;
    },
  };
};
