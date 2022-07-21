import { defineStore } from "pinia";
import type { XenApiVmMetrics } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useVmMetricsStore = defineStore("vm-metrics", () =>
  createRecordContext<XenApiVmMetrics>("VM_metrics")
);
