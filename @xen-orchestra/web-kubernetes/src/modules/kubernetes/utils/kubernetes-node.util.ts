import type {
  KubernetesNodeOperation,
  KubernetesReadyStatus,
  KubernetesSchedulingStatus,
  XoKubernetesCluster,
  XoKubernetesNode,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterCurrentOperation } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import type { ObjectState } from '@core/icons'

export function isControlPlaneNode(node: XoKubernetesNode): boolean {
  return node.role === 'control-plane'
}

export function nodeReadyStatus(node: XoKubernetesNode): KubernetesReadyStatus {
  switch (node.status) {
    case 'Ready':
      return 'ready'
    case 'NotReady':
      return 'not-ready'
    default:
      return 'unknown'
  }
}

export function nodeSchedulingStatus(node: XoKubernetesNode): KubernetesSchedulingStatus {
  if (node.is_draining) {
    return 'draining'
  }

  if (node.is_cordon) {
    return 'cordoned'
  }

  return 'schedulable'
}

/**
 * State displayed on the node icon: cordoned first as it prevents scheduling, then paused reconciliation
 */
export function nodeIconState(node: XoKubernetesNode): ObjectState<'node'> | undefined {
  if (nodeSchedulingStatus(node) !== 'schedulable') {
    return 'cordoned'
  }

  if (node.is_reconciliation_paused) {
    return 'paused'
  }

  return undefined
}

/**
 * Operation in progress on the node: its own drain first, then the cluster operations that affect its nodes
 */
export function nodeCurrentOperation(
  node: XoKubernetesNode,
  cluster: XoKubernetesCluster | undefined
): KubernetesNodeOperation | undefined {
  if (node.is_draining) {
    return 'draining'
  }

  if (cluster === undefined) {
    return undefined
  }

  const clusterOperation = clusterCurrentOperation(cluster)

  switch (clusterOperation) {
    case 'deleting':
    case 'upgrading':
    case 'scaling':
      return clusterOperation
    default:
      return undefined
  }
}
