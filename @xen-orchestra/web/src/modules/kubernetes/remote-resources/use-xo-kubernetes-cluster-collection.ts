import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'

type ApiKubernetesCluster = Omit<XoKubernetesCluster, 'id' | 'type'> & {
  id?: XoKubernetesCluster['id']
}

function toXoCluster(cluster: ApiKubernetesCluster): XoKubernetesCluster {
  return {
    ...cluster,
    id: cluster.id ?? cluster.name,
    type: 'kubernetes-cluster',
    tags: cluster.tags ?? null,
  }
}

export const useXoKubernetesClusterCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/clusters`,
  initialData: () => [] as XoKubernetesCluster[],
  onDataReceived: async (clusters, receivedData) => {
    clusters.value = (receivedData as ApiKubernetesCluster[]).map(toXoCluster)
  },
  state: (clusters, context) => {
    const sortedClusters = useSorted(clusters, (cluster1, cluster2) => cluster1.name.localeCompare(cluster2.name))

    function getClusterById(id: XoKubernetesCluster['id'] | undefined) {
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
