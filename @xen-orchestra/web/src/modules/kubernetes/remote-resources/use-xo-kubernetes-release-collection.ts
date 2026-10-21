import type { XoKubernetesVersionGroup } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

/**
 * Kubernetes releases available to create a cluster, newest first (e.g. `['1.37.1', '1.36.5', …]`)
 */
export const useXoKubernetesReleaseCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/versions-available`,
  initialData: () => [] as string[],
  pollingIntervalMs: false,
  onDataReceived: async (releases, receivedData) => {
    releases.value = (receivedData as XoKubernetesVersionGroup[]).flatMap(versionGroup => versionGroup.releases ?? [])
  },
  state: (releases, context) => ({
    kubernetesReleases: releases,
    areKubernetesReleasesReady: context.isReady,
    hasKubernetesReleasesFetchError: context.hasError,
  }),
})
