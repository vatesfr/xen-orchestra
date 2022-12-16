import { computed } from "vue";
import { sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";
import { useXenApiStore } from "@/stores/xen-api.store";
import { defineStore } from "pinia";

export const useHostStore = defineStore("host", () => {
  const xenApiStore = useXenApiStore();
  const xapiStats = computed(() =>
    xenApiStore.isConnected ? xenApiStore.getXapiStats() : undefined
  );
  const recordContext = createRecordContext<XenApiHost>("host", {
    sort: sortRecordsByNameLabel,
  });

  async function getStats(id: string, granularity: GRANULARITY) {
    const host = recordContext.getRecordByUuid(id);
    if (host === undefined) {
      throw new Error(`Host ${id} could not be found.`);
    }
    return xapiStats.value?._getAndUpdateStats({
      host,
      uuid: host.uuid,
      granularity,
    });
  }

  return {
    ...recordContext,
    getStats,
  };
});
