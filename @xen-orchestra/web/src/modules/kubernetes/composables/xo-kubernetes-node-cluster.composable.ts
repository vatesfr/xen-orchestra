import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoKubernetesNodeCluster(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const { getClusterById } = useXoKubernetesClusterCollection()

  const clusterRoute = computed(() => getKubernetesClusterRoute(node.value.$cluster))

  const clusterLabel = computed(() => getClusterById(node.value.$cluster)?.name ?? node.value.$cluster)

  return {
    clusterRoute,
    clusterLabel,
  }
}
