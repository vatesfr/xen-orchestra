import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useConsoleStore = defineStore("console", () =>
  useXapiCollectionStore().get("console")
);
