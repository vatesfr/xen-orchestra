import { defineStore } from "pinia";
import { computed } from "vue";
import { sortRecordsByNameLabel } from "@/libs/utils";
import type { XenApiVm } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";

export const useVmStore = defineStore("vm", () => {
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

  return {
    ...baseVmContext,
    opaqueRefsByHostRef,
  };
});
