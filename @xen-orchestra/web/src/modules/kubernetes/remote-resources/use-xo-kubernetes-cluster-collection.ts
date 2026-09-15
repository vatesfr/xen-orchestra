import type { FrontXoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'

export const useXoKubernetesClusterCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/clusters`,
  initialData: () => [] as FrontXoKubernetesCluster[],
  state: (clusters, context) => ({
    clusters: useSorted(clusters, (a, b) => a.name.localeCompare(b.name)),
    areClustersReady: context.isReady,
    hasClustersError: context.hasError,
  }),
})
