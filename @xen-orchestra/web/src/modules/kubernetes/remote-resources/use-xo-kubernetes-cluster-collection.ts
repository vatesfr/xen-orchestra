import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { normalizeKubernetesTags } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'

type ApiKubernetesCluster = Omit<XoKubernetesCluster, 'id' | 'type' | 'tags'> & {
  id?: XoKubernetesCluster['id']
  tags?: Record<string, string>
}

function toXoCluster(cluster: ApiKubernetesCluster): XoKubernetesCluster {
  return {
    ...cluster,
    id: cluster.id ?? cluster.name,
    type: 'kubernetes-cluster',
    tags: normalizeKubernetesTags(cluster.tags),
  }
}

export const useXoKubernetesClusterCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/clusters`,
  initialData: () => [] as XoKubernetesCluster[],
  onDataReceived: async (clusters, receivedData) => {
    clusters.value = (receivedData as ApiKubernetesCluster[]).map(toXoCluster)
  },
  state: (clusters, context) => {
    const sortedClusters = useSorted(clusters, (a, b) => a.name.localeCompare(b.name))

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
