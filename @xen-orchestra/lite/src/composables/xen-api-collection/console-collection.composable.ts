import { useXenApiCollection } from "@/composables/xen-api-collection.composable";

export const useConsoleCollection = () => useXenApiCollection("console");
