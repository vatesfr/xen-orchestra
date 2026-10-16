import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

const defaultNodesStatus: XoKubernetesCluster['control_plane_status'] = {
  available_replicas: 0,
  desired_replicas: 1,
  ready_replicas: 0,
  up_to_date_replicas: 0,
  replicas: 0,
  versions: [],
}

export function createKubernetesCluster(overrides: Partial<XoKubernetesCluster> = {}): XoKubernetesCluster {
  return {
    id: 'cluster-1',
    name: 'prod-cluster',
    type: 'kubernetes-cluster',
    phase: 'Running',
    is_available: true,
    is_control_plane_initialized: true,
    is_infrastructure_provisioned: true,
    is_reconciliation_paused: false,
    created_at: '2024-01-15T10:00:00.000Z',
    control_plane_endpoint: '10.0.0.1',
    tags: null,
    control_plane_status: defaultNodesStatus,
    worker_status: defaultNodesStatus,
    ...overrides,
  }
}
