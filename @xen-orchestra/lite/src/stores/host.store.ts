import { defineStore } from "pinia";
import { sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";
import { useXenApiStore } from "@/stores/xen-api.store";

export const useHostStore = defineStore("host", () => {
  const xapiStats = useXenApiStore().getXapiStats();
  const recordContext = createRecordContext<XenApiHost>("host", {
    sort: sortRecordsByNameLabel,
  });

  async function getStats(id: string, granularity: GRANULARITY) {
    const host = recordContext.getRecordByUuid(id);
    if (host === undefined) {
      throw new Error(`Host ${id} could not be found.`);
    }
    return xapiStats._getAndUpdateStats({
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
