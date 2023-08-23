import { createXenApiStore } from "@/stores/xen-api/create-store";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { defineStore } from "pinia";

export const useConsoleStore = defineStore("xen-api-console", () => {
  return createXenApiStore("console");
});

export const useConsoleCollection = createSubscriber(useConsoleStore);
