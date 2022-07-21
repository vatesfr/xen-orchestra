import { defineStore } from "pinia";
import { sortRecordsByNameLabel } from "@/libs/utils";
import type { XenApiHost } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useHostStore = defineStore("host", () =>
  createRecordContext<XenApiHost>("host", { sort: sortRecordsByNameLabel })
);
