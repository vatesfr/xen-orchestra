import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useHostMetricsStore = defineStore("host-metrics", () =>
  useXapiCollectionStore().get("host_metrics")
);
