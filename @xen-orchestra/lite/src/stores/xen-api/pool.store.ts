import type { XenApiPool } from "@/libs/xen-api/xen-api.types";
import { createXenApiStore } from "@/stores/xen-api/create-store";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { defineStore } from "pinia";
import { computed } from "vue";

export const usePoolStore = defineStore("xen-api-pool", () => {
  const baseStore = createXenApiStore("pool");

  const pool = computed<XenApiPool | undefined>(
    () => baseStore.records.value[0]
  );

  return {
    ...baseStore,
    pool,
  };
});

export const usePoolCollection = createSubscriber(usePoolStore);
