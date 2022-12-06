import { defineStore } from "pinia";
import type { XenApiConsole } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useConsoleStore = defineStore("console", () =>
  createRecordContext<XenApiConsole>("console")
);
