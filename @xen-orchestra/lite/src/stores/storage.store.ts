import { defineStore } from "pinia";
import type { XenApiSr } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useSrStore = defineStore("SR", () =>
  createRecordContext<XenApiSr>("SR")
);
