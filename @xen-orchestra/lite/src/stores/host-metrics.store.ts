import { defineStore } from "pinia";
import type { XenApiHostMetrics } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useHostMetricsStore = defineStore("host-metrics", () =>
  createRecordContext<XenApiHostMetrics>("host_metrics")
);
