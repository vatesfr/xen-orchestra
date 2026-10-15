import type { KubernetesReadyStatus, XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

export function nodeReadyStatus(node: XoKubernetesNode): KubernetesReadyStatus {
  return node.status === 'Ready' ? 'ready' : 'not-ready'
}
