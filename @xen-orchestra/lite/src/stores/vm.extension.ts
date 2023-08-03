import type {
  GRANULARITY,
  VmStats,
  XapiStatsResponse,
} from "@/libs/xapi-stats";
import { POWER_STATE, type XenApiHost, type XenApiVm } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type {
  Extension,
  PartialSubscription,
  XenApiRecordExtension,
  XenApiRecordSubscription,
} from "@/types/subscription";
import { computed, type ComputedRef } from "vue";

type RecordsByHostRefExtension = Extension<{
  recordsByHostRef: ComputedRef<Map<XenApiHost["$ref"], XenApiVm[]>>;
}>;

type RunningVmsExtension = Extension<{
  runningVms: ComputedRef<XenApiVm[]>;
}>;

type GetStatsExtension = Extension<
  {
    getStats: (
      id: XenApiVm["uuid"],
      granularity: GRANULARITY,
      ignoreExpired: boolean,
      opts: { abortSignal?: AbortSignal }
    ) => Promise<XapiStatsResponse<VmStats> | undefined> | undefined;
  },
  { hostSubscription: XenApiRecordSubscription<XenApiHost> }
>;

export type VmExtensions = [
  XenApiRecordExtension<XenApiVm>,
  RecordsByHostRefExtension,
  RunningVmsExtension,
  GetStatsExtension
];

export const recordsByHostRefSubscription = (
  vmSubscription: XenApiRecordSubscription<XenApiVm>
): PartialSubscription<RecordsByHostRefExtension> => ({
  recordsByHostRef: computed(() => {
    const vmsByHostOpaqueRef = new Map<XenApiHost["$ref"], XenApiVm[]>();

    vmSubscription.records.value.forEach((vm) => {
      if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
        vmsByHostOpaqueRef.set(vm.resident_on, []);
      }

      vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm);
    });

    return vmsByHostOpaqueRef;
  }),
});

export const runningVmsSubscription = (
  vmSubscription: XenApiRecordSubscription<XenApiVm>
): PartialSubscription<RunningVmsExtension> => ({
  runningVms: computed(() =>
    vmSubscription.records.value.filter(
      (vm) => vm.power_state === POWER_STATE.RUNNING
    )
  ),
});

export const getStatsSubscription = (
  vmSubscription: XenApiRecordSubscription<XenApiVm>,
  hostSubscription: XenApiRecordSubscription<XenApiHost> | undefined
): PartialSubscription<GetStatsExtension> | undefined => {
  if (hostSubscription === undefined) {
    return;
  }

  return {
    getStats: (id, granularity, ignoreExpired = false, { abortSignal }) => {
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

      return xenApiStore.getXapiStats()._getAndUpdateStats<VmStats>({
        abortSignal,
        host,
        ignoreExpired,
        uuid: vm.uuid,
        granularity,
      });
    },
  };
};
