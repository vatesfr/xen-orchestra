import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useSrStore = defineStore("SR", () =>
  useXapiCollectionStore().get("SR")
);
