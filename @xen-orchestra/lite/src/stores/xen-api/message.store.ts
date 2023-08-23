import { createXenApiStore } from "@/stores/xen-api/create-store";
import { defineStore } from "pinia";

export const useMessageStore = defineStore("xen-api-message", () => {
  return createXenApiStore("message");
});
