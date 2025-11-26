import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export type MissingPatch =
  | { name: string; date: string; version?: undefined }
  | { name: string; date?: undefined; version: string }

export const useXoHostMissingPatchesCollection = defineRemoteResource({
  url: (hostId: string) => `/rest/v0/hosts/${hostId}/missing_patches`,
  initialData: () => [] as MissingPatch[],
  state: (hostMissingPatches, context) => ({
    hostMissingPatches,
    areHostMissingPatchesReady: context.isReady,
  }),
})
