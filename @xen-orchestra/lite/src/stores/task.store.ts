import { defineStore } from "pinia";
import type { XenApiTask } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useTaskStore = defineStore("task", () =>
  createRecordContext<XenApiTask>("task")
);
