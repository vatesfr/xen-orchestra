import {
  type ApiKubernetesCluster,
  toXoCluster,
} from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoKubernetesCluster = defineRemoteResource({
  url: (clusterId: XoKubernetesCluster['id']) => `${BASE_URL}/kubernetes/clusters/${clusterId}`,
  initialData: () => undefined as XoKubernetesCluster | undefined,
  onDataReceived: async (cluster, receivedData) => {
    cluster.value = toXoCluster(receivedData as ApiKubernetesCluster)
  },
  state: (cluster, context) => ({
    cluster,
    isClusterReady: context.isReady,
    hasClusterFetchError: context.hasError,
  }),
})
