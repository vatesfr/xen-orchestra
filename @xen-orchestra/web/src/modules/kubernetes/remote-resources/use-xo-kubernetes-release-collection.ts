import type { XoKubernetesVersionGroup } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export type KubernetesReleaseGroup = {
  version: string
  releases: string[]
}

/**
 * Kubernetes releases available to create a cluster, grouped by minor version, newest first
 * (e.g. `[{ version: '1.37', releases: ['1.37.1', '1.37.0'] }, { version: '1.36', releases: ['1.36.5'] }, …]`)
 */
export const useXoKubernetesReleaseCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/versions-available`,
  initialData: () => [] as KubernetesReleaseGroup[],
  pollingIntervalMs: false,
  onDataReceived: async (releaseGroups, receivedData) => {
    releaseGroups.value = (receivedData as XoKubernetesVersionGroup[]).map(({ version, releases }) => ({
      version,
      releases: releases ?? [],
    }))
  },
  state: (releaseGroups, context) => ({
    kubernetesReleaseGroups: releaseGroups,
    areKubernetesReleasesReady: context.isReady,
    hasKubernetesReleasesFetchError: context.hasError,
  }),
})
