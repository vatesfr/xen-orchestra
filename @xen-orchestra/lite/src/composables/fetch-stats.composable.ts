import { computed, onUnmounted, ref } from "vue";
import { type Pausable, promiseTimeout, useTimeoutPoll } from "@vueuse/core";
import type { GRANULARITY, XapiStatsResponse } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";

const STORES_BY_OBJECT_TYPE = {
  host: useHostStore,
  vm: useVmStore,
};

export type Stat<T> = {
  id: string;
  name: string;
  stats?: T;
  pausable: Pausable;
};

export default function useFetchStats<T extends XenApiHost | XenApiVm, S>(
  type: "host" | "vm",
  granularity: GRANULARITY
) {
  const stats = ref<Map<string, Stat<S>>>(new Map());

  const register = (object: T) => {
    if (stats.value.has(object.uuid)) {
      stats.value.get(object.uuid)!.pausable.resume();
      return;
    }

    const pausable = useTimeoutPoll(
      async () => {
        if (!stats.value.has(object.uuid)) {
          return;
        }

        const newStats = (await STORES_BY_OBJECT_TYPE[type]().getStats(
          object.uuid,
          granularity
        )) as XapiStatsResponse<S> | undefined;

        if (newStats !== undefined) {
          stats.value.get(object.uuid)!.stats = newStats.stats;
          await promiseTimeout(newStats.interval * 1000);
        }
      },
      0,
      { immediate: true }
    );

    stats.value.set(object.uuid, {
      id: object.uuid,
      name: object.name_label,
      stats: undefined,
      pausable,
    });
  };

  const unregister = (object: T) => {
    stats.value.get(object.uuid)?.pausable.pause();
    stats.value.delete(object.uuid);
  };

  onUnmounted(() => {
    stats.value.forEach((stat) => stat.pausable.pause());
  });

  return {
    register,
    unregister,
    stats: computed<Stat<S>[]>(() => Array.from(stats.value.values())),
  };
}
