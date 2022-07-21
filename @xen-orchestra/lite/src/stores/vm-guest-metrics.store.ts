import { defineStore } from "pinia";
import type { XenApiVmGuestMetrics } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useVmGuestMetricsStore = defineStore("vm-guest-metrics", () =>
  createRecordContext<XenApiVmGuestMetrics>("VM_guest_metrics")
);
