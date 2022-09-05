import { type Ref, ref } from "vue";
import { type Pausable, promiseTimeout, useTimeoutPoll } from "@vueuse/core";
import type { GRANULARITY, XapiStatsResponse } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";

const STORES_BY_OBJECT_TYPE = {
  host: useHostStore,
  vm: useVmStore,
};

export default function useFetchStats<T>(
  type: "host" | "vm",
  id: string,
  granularity: GRANULARITY
) {
  const stats = ref();
  const fetch = STORES_BY_OBJECT_TYPE[type]().getStats;

  const fetchStats = async () => {
    stats.value = await fetch(id, granularity);
    await promiseTimeout(stats.value.interval * 1000);
  };

  const pausable = useTimeoutPoll(fetchStats, 0);
  return { stats, pausable } as {
    stats: Ref<XapiStatsResponse<T> | undefined>;
    pausable: Pausable;
  };
}
