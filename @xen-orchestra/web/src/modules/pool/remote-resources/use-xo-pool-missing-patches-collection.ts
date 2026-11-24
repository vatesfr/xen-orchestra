import type { MissingPatch } from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoPoolMissingPatchesCollection = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/pools/${poolId}/missing_patches`,
  initialData: () => [] as MissingPatch[],
  // Shown in the header of every page of the pool, and asking each host for its updates: not polled, the Updates tab
  // reloads it once a rolling update is closed
  pollingIntervalMs: false,
  state: (poolMissingPatches, context) => ({
    poolMissingPatches,
    reloadPoolMissingPatches: context.forceReload,
    arePoolMissingPatchesReady: context.isReady,
    hasPoolMissingPatchesError: context.hasError,
  }),
})
