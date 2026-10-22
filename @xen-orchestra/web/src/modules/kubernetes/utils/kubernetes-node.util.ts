import type {
  KubernetesReadyStatus,
  KubernetesSchedulingStatus,
  XoKubernetesNode,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

export function isControlPlaneNode(node: XoKubernetesNode): boolean {
  return node.role === 'control-plane'
}

export function nodeReadyStatus(node: XoKubernetesNode): KubernetesReadyStatus {
  return node.status === 'Ready' ? 'ready' : 'not-ready'
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
