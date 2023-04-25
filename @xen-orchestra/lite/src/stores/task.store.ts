import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useTaskStore = defineStore("task", () =>
  useXapiCollectionStore().get("task")
);
