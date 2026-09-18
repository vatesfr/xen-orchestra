import { useXoKubernetesTreeData } from '@/modules/kubernetes/composables/xo-kubernetes-tree-data.composable.ts'
import type { XoKubernetesRoot } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { KUBERNETES_NAME } from '@/shared/constants.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { computed } from 'vue'

export function useXoKubernetesTreeDefinitions(predicate: (node: TreeNodeBase) => boolean | undefined) {
  const { clusters, nodesByCluster, namespacesByCluster, podsByNamespace, areKubernetesObjectsReady } =
    useXoKubernetesTreeData()

  const kubernetesRoot: XoKubernetesRoot = {
    type: 'kubernetes',
    name: KUBERNETES_NAME,
  }

  const kubernetesRoots = computed(() => [kubernetesRoot])

  const definitions = computed(() =>
    defineTree(
      'kubernetes',
      kubernetesRoots.value,
      {
        getId: () => 'kubernetes-root',
        getLabel: 'name',
        discriminator: 'kubernetes',
      },
      () =>
        defineTree(
          'clusters',
          clusters.value,
          {
            getId: 'name',
            getLabel: 'name',
            predicate,
            discriminator: 'kubernetes-cluster',
          },
          cluster => [
            ...defineTree('nodes', nodesByCluster.value.get(cluster.name) ?? [], {
              getId: node => `${node.$cluster}/${node.name}`,
              getLabel: 'name',
              predicate,
              discriminator: 'kubernetes-node',
            }),
            ...defineTree(
              'namespaces',
              namespacesByCluster.value.get(cluster.name) ?? [],
              {
                getId: namespace => `${namespace.$cluster}/${namespace.name}`,
                getLabel: 'name',
                predicate,
                discriminator: 'kubernetes-namespace',
              },
              namespace =>
                defineTree('pods', podsByNamespace.value.get(`${cluster.name}/${namespace.name}`) ?? [], {
                  getId: pod => `${pod.$namespace}/${pod.name}`,
                  getLabel: 'name',
                  predicate,
                  discriminator: 'kubernetes-pod',
                })
            ),
          ]
        )
    )
  )

  return {
    definitions,
    isReady: areKubernetesObjectsReady,
  }
}
