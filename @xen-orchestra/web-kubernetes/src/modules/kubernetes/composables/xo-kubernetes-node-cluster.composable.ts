import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { KubernetesNodeOperation, XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { nodeCurrentOperation } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoKubernetesNodeCluster(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const { t } = useI18n()

  const { getClusterById } = useXoKubernetesClusterCollection()

  const clusterRoute = computed(() => getKubernetesClusterRoute(node.value.$cluster))

  const clusterLabel = computed(() => getClusterById(node.value.$cluster)?.name ?? node.value.$cluster)

  const pendingOperation = computed(() => nodeCurrentOperation(node.value, getClusterById(node.value.$cluster)))

  const isChangingState = computed(() => pendingOperation.value !== undefined)

  const currentOperation = useMapper<KubernetesNodeOperation | 'unknown', string>(
    () => pendingOperation.value,
    {
      draining: t('draining'),
      deleting: t('deleting'),
      upgrading: t('upgrading'),
      scaling: t('scaling'),
      unknown: '',
    },
    'unknown'
  )

  return {
    clusterRoute,
    clusterLabel,
    isChangingState,
    currentOperation,
  }
}
