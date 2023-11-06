import { useXenApiStoreSubscribableContext } from "@/composables/xen-api-store-subscribable-context.composable";
import { createUseCollection } from "@/stores/xen-api/create-use-collection";
import { defineStore } from "pinia";

export const usePifStore = defineStore("xen-api-pif", () => {
  return useXenApiStoreSubscribableContext("pif");
});

export const usePifCollection = createUseCollection(usePifStore);
