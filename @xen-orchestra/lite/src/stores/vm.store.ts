import { sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY, XapiStatsResponse } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import type { CollectionSubscription } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { computed, type ComputedRef } from "vue";

type HostSubscription = CollectionSubscription<XenApiHost>;

type VmSubscribeOptions<H extends undefined | HostSubscription> = {
  hostSubscription?: H;
};

interface VmSubscription extends CollectionSubscription<XenApiVm> {
  recordsByHostRef: ComputedRef<Map<string, XenApiVm[]>>;
  runningVms: ComputedRef<XenApiVm[]>;
}

interface VmSubscriptionWithGetStats extends VmSubscription {
  getStats: (
    id: string,
    granularity: GRANULARITY
  ) => Promise<XapiStatsResponse<any>>;
}

export const useVmStore = defineStore("vm", () => {
  const vmCollection = useXapiCollectionStore().get("VM");

  vmCollection.setFilter(
    (vm) => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain
  );

  vmCollection.setSort(sortRecordsByNameLabel);

  function subscribe(options?: VmSubscribeOptions<undefined>): VmSubscription;

  function subscribe(
    options?: VmSubscribeOptions<HostSubscription>
  ): VmSubscriptionWithGetStats;

  function subscribe({
    hostSubscription,
  }: VmSubscribeOptions<undefined | HostSubscription> = {}) {
    const vmSubscription = vmCollection.subscribe();

    const recordsByHostRef = computed(() => {
      const vmsByHostOpaqueRef = new Map<string, XenApiVm[]>();

      vmSubscription.records.value.forEach((vm) => {
        if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
          vmsByHostOpaqueRef.set(vm.resident_on, []);
        }

        vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm);
      });

      return vmsByHostOpaqueRef;
    });

    const runningVms = computed(() =>
      vmSubscription.records.value.filter((vm) => vm.power_state === "Running")
    );

    const subscription = {
      ...vmSubscription,
      recordsByHostRef,
      runningVms,
    };

    if (hostSubscription === undefined) {
      return subscription;
    }

    const getStats = (id: string, granularity: GRANULARITY) => {
      const xenApiStore = useXenApiStore();

      if (!xenApiStore.isConnected) {
        return undefined;
      }

      const vm = vmSubscription.getByUuid(id);

      if (vm === undefined) {
        throw new Error(`VM ${id} could not be found.`);
      }

      const host = hostSubscription.getByOpaqueRef(vm.resident_on);

      if (host === undefined) {
        throw new Error(`VM ${id} is halted or host could not be found.`);
      }

      return xenApiStore.getXapiStats()._getAndUpdateStats({
        host,
        uuid: vm.uuid,
        granularity,
      });
    };

    return {
      ...subscription,
      getStats,
    };
  }

  return {
    ...vmCollection,
    subscribe,
  };
});
