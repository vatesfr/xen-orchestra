import type { FrontXoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'

type ApiKubernetesCluster = Omit<FrontXoKubernetesCluster, 'id'>

function toFrontCluster(cluster: ApiKubernetesCluster): FrontXoKubernetesCluster {
  return {
    ...cluster,
    id: cluster.name,
  }
}

export const useXoKubernetesClusterCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/clusters`,
  initialData: () => [] as FrontXoKubernetesCluster[],
  onDataReceived: async (clusters, receivedData) => {
    clusters.value = (receivedData as ApiKubernetesCluster[]).map(toFrontCluster)
  },
  state: (clusters, context) => {
    const sortedClusters = useSorted(clusters, (a, b) => a.name.localeCompare(b.name))

    function getClusterById(id: FrontXoKubernetesCluster['id'] | undefined) {
      if (id === undefined) {
        return undefined
      }

      return sortedClusters.value.find(cluster => cluster.id === id)
    }

    return {
      clusters: sortedClusters,
      getClusterById,
      useGetClusterById: reactify(getClusterById),
      areClustersReady: context.isReady,
      hasClusterFetchError: context.hasError,
    }
  },
})
