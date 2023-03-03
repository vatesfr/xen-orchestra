import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useVmGuestMetricsStore = defineStore("vm-guest-metrics", () =>
  useXapiCollectionStore().get("VM_guest_metrics")
);
