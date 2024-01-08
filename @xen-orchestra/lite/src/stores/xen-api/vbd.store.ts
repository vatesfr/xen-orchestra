import { useXenApiStoreSubscribableContext } from "@/composables/xen-api-store-subscribable-context.composable";
import { createUseCollection } from "@/stores/xen-api/create-use-collection";
import { defineStore } from "pinia";

export const useVbdStore = defineStore("xen-api-vbd", () => {
  const context = useXenApiStoreSubscribableContext("vbd");
  
  return {
    ...context,
  };
});

export const useVbdCollection = createUseCollection(useVbdStore);