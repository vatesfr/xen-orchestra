import { defineStore } from "pinia";
import { computed } from "vue";
import type { XenApiPool } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const usePoolStore = defineStore("pool", () => {
  const { init, opaqueRefs, getRecord, isReady } =
    createRecordContext<XenApiPool>("pool");

  const poolOpaqueRef = computed(() => opaqueRefs.value[0]);
  const pool = computed(() =>
    isReady.value ? getRecord(poolOpaqueRef.value) : undefined
  );

  return {
    init,
    pool,
    poolOpaqueRef,
    isReady,
  };
});
