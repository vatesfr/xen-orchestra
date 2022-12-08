import { sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiVm } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { createRecordContext } from "@/stores/index";
import { useXenApiStore } from "@/stores/xen-api.store";
import { defineStore } from "pinia";
import { computed } from "vue";
import { computedAsync } from "@vueuse/core";

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

  const xenApi = computedAsync(() => xenApiStore.getXapi());

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

  const start = (refs: string[]) =>
    Promise.all(
      refs.map((vmRef) => xenApi.value.call("VM.start", [vmRef, false, false]))
    );

  const startOn = (refs: string[], hostRef: string) =>
    Promise.all(
      refs.map((vmRef) =>
        xenApi.value.call("VM.start_on", [vmRef, hostRef, false, false])
      )
    );

  const pause = (refs: string[]) =>
    Promise.all(refs.map((vmRef) => xenApi.value.call("VM.pause", [vmRef])));

  const suspend = (refs: string[]) =>
    Promise.all(refs.map((vmRef) => xenApi.value.call("VM.suspend", [vmRef])));

  const resume = (refAndPowerState: [string, string][]) =>
    Promise.all(
      refAndPowerState.map(([vmRef, vmPowerState]) => {
        if (vmPowerState !== "Suspended" && vmPowerState !== "Paused") {
          console.error("VM.resume: Invalid power_state", {
            $ref: vmRef,
            power_state: vmPowerState,
          });
          return;
        }
        const isSuspended = vmPowerState === "Suspended";
        return xenApi.value.call(
          `VM.${isSuspended ? "resume" : "unpause"}`,
          isSuspended ? [vmRef, false, false] : [vmRef]
        );
      })
    );

  const reboot = (refs: string[], force = false) =>
    Promise.all(
      refs.map((vmRef) =>
        xenApi.value.call(`VM.${force ? "hard" : "clean"}_reboot`, [vmRef])
      )
    );

  const shutdown = (refs: string[], force = false) =>
    Promise.all(
      refs.map((vmRef) =>
        xenApi.value.call(`VM.${force ? "hard" : "clean"}_shutdown`, [vmRef])
      )
    );

  return {
    ...baseVmContext,
    getStats,
    opaqueRefsByHostRef,
    start,
    startOn,
    pause,
    suspend,
    resume,
    reboot,
    shutdown,
  };
});
