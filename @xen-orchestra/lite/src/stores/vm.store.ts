import { sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiVm } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { createRecordContext } from "@/stores/index";
import { useXenApiStore } from "@/stores/xen-api.store";
import { defineStore } from "pinia";
import { computed } from "vue";

export const useVmStore = defineStore("vm", () => {
  const xenApiStore = useXenApiStore();
  const hostStore = useHostStore();
  const xapiStats = computed(() =>
    xenApiStore.isConnected ? xenApiStore.getXapiStats() : undefined
  );
  const baseVmContext = createRecordContext<XenApiVm>("VM", {
    filter: (vm) =>
      !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain,
    sort: sortRecordsByNameLabel,
  });

  const opaqueRefsByHostRef = computed(() => {
    const vmsOpaqueRefsByHostOpaqueRef = new Map<string, string[]>();

    baseVmContext.opaqueRefs.value.forEach((opaqueRef) => {
      const vm = baseVmContext.getRecord(opaqueRef);

      if (!vmsOpaqueRefsByHostOpaqueRef.has(vm.resident_on)) {
        vmsOpaqueRefsByHostOpaqueRef.set(vm.resident_on, []);
      }

      vmsOpaqueRefsByHostOpaqueRef.get(vm.resident_on)?.push(opaqueRef);
    });

    return vmsOpaqueRefsByHostOpaqueRef;
  });

  async function getStats(id: string, granularity: GRANULARITY) {
    const vm = baseVmContext.getRecordByUuid(id);
    if (vm === undefined) {
      throw new Error(`VM ${id} could not be found.`);
    }
    const host = hostStore.getRecord(vm.resident_on);
    if (host === undefined) {
      throw new Error(`VM ${id} is halted or host could not be found.`);
    }

    return xapiStats.value?._getAndUpdateStats({
      host,
      uuid: vm.uuid,
      granularity,
    });
  }

  return {
    ...baseVmContext,
    getStats,
    opaqueRefsByHostRef,
  };
});
