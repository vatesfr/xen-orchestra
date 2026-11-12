/**
 * XO6 SDK for UI plugins.
 *
 * This module is shared at runtime with the UI plugins (Module Federation remotes) as `@xen-orchestra/web/ui-plugin-sdk`:
 * it is the only part of `@xen-orchestra/web` a plugin can use, besides `@xen-orchestra/web-core` and the shared
 * libraries (see `federation.config.ts`).
 *
 * Plugins get the instances living in XO6 (same stores, same collections), so everything exported here is part of the
 * plugin API: keep it small, and bump `UI_PLUGIN_API_VERSION` on breaking changes.
 *
 * Only use explicit named exports (no `export *`): the remote side needs to know the exported names.
 */

export { default as VmDashboardCpuUsageChart } from '@/modules/vm/components/dashboard/VmDashboardCpuUsageChart.vue'
export { default as VmDashboardNetworkUsageChart } from '@/modules/vm/components/dashboard/VmDashboardNetworkUsageChart.vue'
export { default as VmDashboardRamUsageChart } from '@/modules/vm/components/dashboard/VmDashboardRamUsageChart.vue'
export { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
export { useXoCurrentUserResource } from '@/modules/user/remote-resources/use-xo-current-user.ts'
export { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
export {
  UI_PLUGIN_API_VERSION,
  type UiPluginApiVersion,
  type UiPluginMessages,
  type UiPluginTree,
  type UiPluginTreeDefinitions,
  type XoUiPlugin,
} from '@/modules/ui-plugin/types/ui-plugin.type.ts'
export { default as FormTextarea } from '@/shared/components/form/FormTextarea.vue'
export { useChartPercentFormatter } from '@/shared/composables/chart-percent-formatter.composable.ts'
export { useFetchStats } from '@/shared/composables/fetch-stats.composable.ts'
export { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
export {
  buildTimestamps,
  type ChartPoint,
  countSamples,
  formatChartBytes,
  getChartMaxValue,
  getMaxSample,
  getPairedUsageMaxValue,
  getUsedMemoryAtIndex,
  type PairedUsageSeries,
  RAM_CHART_MAX_FALLBACK,
  sumAtIndex,
} from '@/shared/utils/chart-stats.util.ts'
export { BASE_URL, fetchDelete, fetchGet, fetchPost, fetchPut, fetchRequest } from '@/shared/utils/fetch.util.ts'
export { safePushInMap } from '@/shared/utils/map.util.ts'
export { GRANULARITY, RRD_STEP_FROM_STRING } from '@/shared/utils/rest-api-stats.ts'
