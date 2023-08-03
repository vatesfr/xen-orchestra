import { isHostRunning } from "@/libs/utils";
import type {
  GRANULARITY,
  HostStats,
  XapiStatsResponse,
} from "@/libs/xapi-stats";
import type { XenApiHost, XenApiHostMetrics } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type {
  Extension,
  XenApiRecordExtension,
  XenApiRecordSubscription,
} from "@/types/subscription";
import type { PartialSubscription } from "@/types/subscription";
import { computed } from "vue";
import type { ComputedRef } from "vue";

type GetStatsExtension = Extension<{
  getStats: (
    hostUuid: XenApiHost["uuid"],
    granularity: GRANULARITY,
    ignoreExpired: boolean,
    opts: { abortSignal?: AbortSignal }
  ) => Promise<XapiStatsResponse<HostStats> | undefined> | undefined;
}>;

type RunningHostsExtension = Extension<
  { runningHosts: ComputedRef<XenApiHost[]> },
  { hostMetricsSubscription: XenApiRecordSubscription<XenApiHostMetrics> }
>;

export type HostExtensions = [
  XenApiRecordExtension<XenApiHost>,
  GetStatsExtension,
  RunningHostsExtension
];

export const getStatsSubscription = (
  hostSubscription: XenApiRecordSubscription<XenApiHost>
): PartialSubscription<GetStatsExtension> => {
  const xenApiStore = useXenApiStore();

  return {
    getStats: (
      hostUuid,
      granularity,
      ignoreExpired = false,
      { abortSignal }
    ) => {
      const host = hostSubscription.getByUuid(hostUuid);

      if (host === undefined) {
        throw new Error(`Host ${hostUuid} could not be found.`);
      }

      const xapiStats = xenApiStore.isConnected
        ? xenApiStore.getXapiStats()
        : undefined;

      return xapiStats?._getAndUpdateStats<HostStats>({
        abortSignal,
        host,
        ignoreExpired,
        uuid: host.uuid,
        granularity,
      });
    },
  };
};

export const runningHostsSubscription = (
  hostSubscription: XenApiRecordSubscription<XenApiHost>,
  hostMetricsSubscription:
    | XenApiRecordSubscription<XenApiHostMetrics>
    | undefined
): PartialSubscription<RunningHostsExtension> | undefined => {
  if (hostMetricsSubscription === undefined) {
    return undefined;
  }

  return {
    runningHosts: computed(() =>
      hostSubscription.records.value.filter((host) =>
        isHostRunning(host, hostMetricsSubscription)
      )
    ),
  };
};
