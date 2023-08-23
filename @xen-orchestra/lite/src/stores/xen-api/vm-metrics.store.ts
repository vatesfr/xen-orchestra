import { createXenApiStore } from "@/stores/xen-api/create-store";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { defineStore } from "pinia";

export const useVmMetricsStore = defineStore("xen-api-vm-metrics", () => {
  return createXenApiStore("vm_metrics");
});

export const useVmMetricsCollection = createSubscriber(useVmMetricsStore);
