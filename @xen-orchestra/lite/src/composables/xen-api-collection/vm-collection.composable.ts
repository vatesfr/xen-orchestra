import type { GetStats } from "@/composables/fetch-stats.composable";
import { useXenApiCollection } from "@/composables/xen-api-collection.composable";
import { useHostCollection } from "@/composables/xen-api-collection/host-collection.composable";
import { sortRecordsByNameLabel } from "@/libs/utils";
import type { VmStats } from "@/libs/xapi-stats";
import {
  POWER_STATE,
  VM_OPERATION,
  type XenApiHost,
  type XenApiVm,
} from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import { castArray } from "lodash-es";
import { computed } from "vue";

export const useVmCollection = () => {
  const collection = useXenApiCollection("VM");
  const hostCollection = useHostCollection();
  const xenApiStore = useXenApiStore();

  const records = computed(() =>
    collection.records.value
      .filter(
        (vm) => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain
      )
      .sort(sortRecordsByNameLabel)
  );

  return {
    ...collection,
    records,
    isOperationPending: (
      vm: XenApiVm,
      operations: VM_OPERATION[] | VM_OPERATION
    ) => {
      const currentOperations = Object.values(vm.current_operations);
      return castArray(operations).some((operation) =>
        currentOperations.includes(operation)
      );
    },
    runningVms: computed(() =>
      records.value.filter((vm) => vm.power_state === POWER_STATE.RUNNING)
    ),
    recordsByHostRef: computed(() => {
      const vmsByHostOpaqueRef = new Map<XenApiHost["$ref"], XenApiVm[]>();

      records.value.forEach((vm) => {
        if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
          vmsByHostOpaqueRef.set(vm.resident_on, []);
        }

        vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm);
      });

      return vmsByHostOpaqueRef;
    }),
    getStats: ((id, granularity, ignoreExpired = false, { abortSignal }) => {
      if (!xenApiStore.isConnected) {
        return undefined;
      }

      const vm = collection.getByUuid(id);

      if (vm === undefined) {
        throw new Error(`VM ${id} could not be found.`);
      }

      const host = hostCollection.getByOpaqueRef(vm.resident_on);

      if (host === undefined) {
        throw new Error(`VM ${id} is halted or host could not be found.`);
      }

      return xenApiStore.getXapiStats()._getAndUpdateStats<VmStats>({
        abortSignal,
        host,
        ignoreExpired,
        uuid: vm.uuid,
        granularity,
      });
    }) as GetStats<XenApiVm>,
  };
};
