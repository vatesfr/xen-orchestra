import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

export function createKubernetesNode(overrides: Partial<XoKubernetesNode> = {}): XoKubernetesNode {
  return {
    $cluster: 'cluster-1',
    id: 'node-1',
    ips: ['10.0.0.2'],
    is_cordon: false,
    is_draining: false,
    is_reconciliation_paused: false,
    name: 'prod-cluster-cp-abcde',
    node_id: '71df26a2-678a-49c7-8232-8ebcac4987ab',
    node_name: 'cp-10-0-0-2',
    role: 'control-plane',
    status: 'Ready',
    type: 'kubernetes-node',
    version: 'v1.30.4',
    ...overrides,
  }
}
