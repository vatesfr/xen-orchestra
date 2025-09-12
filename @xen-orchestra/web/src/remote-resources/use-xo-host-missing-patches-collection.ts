import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XcpPatches, XsPatches } from '@vates/types'

export const useXoHostMissingPatchesCollection = defineRemoteResource({
  url: (hostId: string) => `/rest/v0/hosts/${hostId}/missing_patches`,
  initialData: () => [] as XsPatches[] | XcpPatches[],
  state: (hostMissingPatches, context) => ({
    hostMissingPatches,
    areHostMissingPatchesReady: context.isReady,
  }),
})
