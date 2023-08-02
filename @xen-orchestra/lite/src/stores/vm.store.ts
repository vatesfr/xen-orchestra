import { sortRecordsByNameLabel } from "@/libs/utils";
import type {
  GRANULARITY,
  VmStats,
  XapiStatsResponse,
} from "@/libs/xapi-stats";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { POWER_STATE } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { createSubscribe, type Subscription } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { computed, type ComputedRef } from "vue";

type GetStats = (
  id: XenApiVm["uuid"],
  granularity: GRANULARITY,
  ignoreExpired: boolean,
  opts: { abortSignal?: AbortSignal }
) => Promise<XapiStatsResponse<VmStats> | undefined> | undefined;
type DefaultExtension = {
  recordsByHostRef: ComputedRef<Map<XenApiHost["$ref"], XenApiVm[]>>;
  runningVms: ComputedRef<XenApiVm[]>;
};

type GetStatsExtension = [
  {
    getStats: GetStats;
  },
  { hostSubscription: Subscription<"host", object> }
];

type Extensions = [DefaultExtension, GetStatsExtension];

export const useVmStore = defineStore("vm", () => {
  const vmCollection = useXapiCollectionStore().get("VM");

  vmCollection.setFilter(
    (vm) => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain
  );

  vmCollection.setSort(sortRecordsByNameLabel);

  const subscribe = createSubscribe<"VM", Extensions>((options) => {
    const originalSubscription = vmCollection.subscribe(options);

    const extendedSubscription = {
      recordsByHostRef: computed(() => {
        const vmsByHostOpaqueRef = new Map<XenApiHost["$ref"], XenApiVm[]>();

        originalSubscription.records.value.forEach((vm) => {
          if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
            vmsByHostOpaqueRef.set(vm.resident_on, []);
          }

          vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm);
        });

        return vmsByHostOpaqueRef;
      }),
      runningVms: computed(() =>
        originalSubscription.records.value.filter(
          (vm) => vm.power_state === POWER_STATE.RUNNING
        )
      ),
    };

    const hostSubscription = options?.hostSubscription;

    const getStatsSubscription:
      | {
          getStats: GetStats;
        }
      | undefined =
      hostSubscription !== undefined
        ? {
            getStats: (
              id,
              granularity,
              ignoreExpired = false,
              { abortSignal }
            ) => {
              const xenApiStore = useXenApiStore();

              if (!xenApiStore.isConnected) {
                return undefined;
              }

              const vm = originalSubscription.getByUuid(id);

              if (vm === undefined) {
                throw new Error(`VM ${id} could not be found.`);
              }

              const host = hostSubscription.getByOpaqueRef(vm.resident_on);

              if (host === undefined) {
                throw new Error(
                  `VM ${id} is halted or host could not be found.`
                );
              }

              return xenApiStore.getXapiStats()._getAndUpdateStats<VmStats>({
                abortSignal,
                host,
                ignoreExpired,
                uuid: vm.uuid,
                granularity,
              });
            },
          }
        : undefined;

    return {
      ...originalSubscription,
      ...extendedSubscription,
      ...getStatsSubscription,
    };
  });

  return {
    ...vmCollection,
    subscribe,
  };
});
