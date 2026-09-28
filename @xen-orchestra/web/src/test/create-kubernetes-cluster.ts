import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

const defaultNodesStatus: XoKubernetesCluster['controlPlaneStatus'] = {
  availableReplicas: 0,
  desiredReplicas: 1,
  readyReplicas: 0,
  replicas: 0,
}

export function createKubernetesCluster(overrides: Partial<XoKubernetesCluster> = {}): XoKubernetesCluster {
  return {
    id: 'cluster-1',
    name: 'prod-cluster',
    type: 'kubernetes-cluster',
    phase: 'Running',
    createdAt: '2024-01-15T10:00:00.000Z',
    controlPlaneEndpoint: '10.0.0.1',
    tags: null,
    controlPlaneStatus: defaultNodesStatus,
    workerStatus: defaultNodesStatus,
    ...overrides,
  }
}
