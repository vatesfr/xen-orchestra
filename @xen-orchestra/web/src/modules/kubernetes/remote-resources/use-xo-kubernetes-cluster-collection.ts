import { useWatchKubernetesCollection } from '@/modules/kubernetes/composables/use-watch-kubernetes-collection.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { reactify } from '@vueuse/shared'
import { ref, watch } from 'vue'

type ApiKubernetesCluster = Omit<XoKubernetesCluster, 'type'>

function toXoCluster(cluster: ApiKubernetesCluster): XoKubernetesCluster {
  return {
    ...cluster,
    type: 'kubernetes-cluster',
    tags: cluster.tags ?? null,
  }
}

export const useXoKubernetesClusterCollection = defineRemoteResource({
  url: `${BASE_URL}/kubernetes/clusters`,
  initWatchCollection: () => useWatchKubernetesCollection('kubernetes-cluster'),
  initialData: () => [] as ApiKubernetesCluster[],
  state: (rawClusters, context) => {
    const sortedRawClusters = useSorted(rawClusters, (cluster1, cluster2) => cluster1.name.localeCompare(cluster2.name))

    const clusters = ref<XoKubernetesCluster[]>([])

    watch(sortedRawClusters, _clusters => {
      clusters.value = _clusters.map(toXoCluster)
    })

    function getClusterById(id: XoKubernetesCluster['id'] | undefined) {
      if (id === undefined) {
        return undefined
      }

      return clusters.value.find(cluster => cluster.id === id)
    }

    return {
      clusters,
      getClusterById,
      useGetClusterById: reactify(getClusterById),
      areClustersReady: context.isReady,
      hasClusterFetchError: context.hasError,
    }
  },
})
