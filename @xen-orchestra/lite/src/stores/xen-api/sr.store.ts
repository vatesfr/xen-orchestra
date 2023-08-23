import { createXenApiStore } from "@/stores/xen-api/create-store";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { defineStore } from "pinia";

export const useSrStore = defineStore("xen-api-sr", () => {
  return createXenApiStore("sr");
});

export const useSrCollection = createSubscriber(useSrStore);
