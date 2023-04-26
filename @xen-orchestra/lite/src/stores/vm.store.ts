import { requireSubscription, sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import {
  type CollectionSubscription,
  useXapiCollectionStore,
} from "@/stores/xapi-collection.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { defineStore } from "pinia";
import { computed } from "vue";

type SubscribeOptions = {
  hostSubscription?: CollectionSubscription<XenApiHost>;
};

export const useVmStore = defineStore("vm", () => {
  const vmCollection = useXapiCollectionStore().get("VM");

  vmCollection.setFilter(
    (vm) => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain
  );

  vmCollection.setSort(sortRecordsByNameLabel);

  const subscribe = ({ hostSubscription }: SubscribeOptions = {}) => {
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

    const getStats = (id: string, granularity: GRANULARITY) => {
      requireSubscription(hostSubscription, "host");

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
      ...vmSubscription,
      recordsByHostRef,
      getStats,
      runningVms,
    };
  };

  return {
    ...vmCollection,
    subscribe,
  };
});
