import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useVmMetricsStore = defineStore("vm-metrics", () =>
  useXapiCollectionStore().get("VM_metrics")
);
