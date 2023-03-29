import { computed, onUnmounted, ref, type ComputedRef } from "vue";
import { type Pausable, promiseTimeout, useTimeoutPoll } from "@vueuse/core";
import {
  type GRANULARITY,
  type HostStats,
  RRD_STEP_FROM_STRING,
  type VmStats,
  type XapiStatsResponse,
} from "@/libs/xapi-stats";
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
  stats?: T | null;
  pausable: Pausable;
};

export type FetchedStats<
  T extends XenApiHost | XenApiVm,
  S extends HostStats | VmStats
> = {
  register: (object: T) => void;
  unregister: (object: T) => void;
  stats?: ComputedRef<Stat<S>[] | null>;
  timestampStart?: ComputedRef<number>;
  timestampEnd?: ComputedRef<number>;
};

export default function useFetchStats<
  T extends XenApiHost | XenApiVm,
  S extends HostStats | VmStats
>(type: "host" | "vm", granularity: GRANULARITY) {
  const stats = ref<Map<string, Stat<S>>>(new Map());
  const timestamp = ref<number[]>([0, 0]);

  const register = (object: T) => {
    const mapKey = `${object.uuid}-${granularity}`;
    if (stats.value.has(mapKey)) {
      stats.value.get(mapKey)!.pausable.resume();
      return;
    }

    const pausable = useTimeoutPoll(
      async () => {
        if (!stats.value.has(mapKey)) {
          return;
        }

        const objectStore = STORES_BY_OBJECT_TYPE[type]();

        if (objectStore.hasError) {
          stats.value.get(mapKey)!.stats = null;
          return;
        }

        const newStats = (await objectStore.getStats(
          object.uuid,
          granularity
        )) as XapiStatsResponse<S>;

        timestamp.value = [
          newStats.endTimestamp -
            RRD_STEP_FROM_STRING[granularity] *
              (newStats.stats.memory.length - 1),
          newStats.endTimestamp,
        ];

        stats.value.get(mapKey)!.stats = newStats.stats;
        await promiseTimeout(newStats.interval * 1000);
      },
      0,
      { immediate: true }
    );

    stats.value.set(mapKey, {
      id: object.uuid,
      name: object.name_label,
      stats: undefined,
      pausable,
    });
  };

  const unregister = (object: T) => {
    const mapKey = `${object.uuid}-${granularity}`;
    stats.value.get(mapKey)?.pausable.pause();
    stats.value.delete(mapKey);
  };

  onUnmounted(() => {
    stats.value.forEach((stat) => stat.pausable.pause());
  });

  return {
    register,
    unregister,
    stats: computed<Stat<S>[]>(() => Array.from(stats.value.values())),
    timestampStart: computed(() => timestamp.value[0]),
    timestampEnd: computed(() => timestamp.value[1]),
  };
}
