import { useXenApiStoreSubscribableContext } from "@/composables/xen-api-store-subscribable-context.composable";
import { createUseCollection } from "@/stores/xen-api/create-use-collection";
import { defineStore } from "pinia";

export const usePbdStore = defineStore("xen-api-pbd", () => {
  return useXenApiStoreSubscribableContext("pbd");
});

export const usePbdCollection = createUseCollection(usePbdStore);
