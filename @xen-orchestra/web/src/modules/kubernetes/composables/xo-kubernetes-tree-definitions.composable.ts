import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import { KUBERNETES_ROOT_ID, type XoKubernetesRoot } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { KUBERNETES_NAME } from '@/shared/constants.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { computed } from 'vue'

export function useXoKubernetesTreeDefinitions(predicate: (node: TreeNodeBase) => boolean | undefined) {
  const { clusters, areClustersReady } = useXoKubernetesClusterCollection()

  const kubernetesRoot: XoKubernetesRoot = {
    id: KUBERNETES_ROOT_ID,
    type: 'kubernetes',
    name: KUBERNETES_NAME,
  }

  const definitions = computed(() =>
    defineTree(
      'kubernetes',
      [kubernetesRoot],
      {
        getLabel: 'name',
        discriminator: 'kubernetes',
      },
      () =>
        defineTree(
          'clusters',
          clusters.value,
          {
            getId: 'id',
            getLabel: 'name',
            predicate,
            discriminator: 'kubernetes-cluster',
          },
          () => [
            ...defineTree('nodes', [], {
              getId: 'id',
              getLabel: 'name',
              predicate,
              discriminator: 'kubernetes-node',
            }),
            ...defineTree('namespaces', [], {
              getId: 'id',
              getLabel: 'name',
              predicate,
              discriminator: 'kubernetes-namespace',
            }),
          ]
        )
    )
  )

  return {
    definitions,
    isReady: areClustersReady,
  }
}
