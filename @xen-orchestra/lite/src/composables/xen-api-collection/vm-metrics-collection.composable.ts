import { useXenApiCollection } from "@/composables/xen-api-collection.composable";

export const useVmMetricsCollection = () => useXenApiCollection("VM_metrics");
