import type { KubernetesClusterPhase, XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import {
  clusterStatus,
  clusterVersion,
  formatNodesCount,
  getClusterUpdates,
  isClusterDeletable,
  isClusterPhaseReady,
  isClusterReconciliationToggleable,
  isClusterUpgradable,
} from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'

describe('isClusterDeletable', () => {
  it.each<KubernetesClusterPhase>(['Running', 'Provisioned', 'Failed', 'Updating'])('returns true for %s', phase => {
    expect(isClusterDeletable(phase)).toBe(true)
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning', 'Deleting', 'Deleted', 'Unknown'])(
    'returns false for %s',
    phase => {
      expect(isClusterDeletable(phase)).toBe(false)
    }
  )
})

describe('isClusterReconciliationToggleable', () => {
  it.each<KubernetesClusterPhase>([
    'Pending',
    'Provisioning',
    'Provisioned',
    'Running',
    'Updating',
    'Failed',
    'Unknown',
  ])('returns true for %s', phase => {
    expect(isClusterReconciliationToggleable(phase)).toBe(true)
  })

  it.each<KubernetesClusterPhase>(['Deleting', 'Deleted'])('returns false for %s', phase => {
    expect(isClusterReconciliationToggleable(phase)).toBe(false)
  })
})

describe('isClusterPhaseReady', () => {
  it.each<KubernetesClusterPhase>(['Provisioned', 'Running'])('returns true for %s', phase => {
    expect(isClusterPhaseReady(phase)).toBe(true)
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning', 'Updating', 'Deleting', 'Deleted', 'Failed', 'Unknown'])(
    'returns false for %s',
    phase => {
      expect(isClusterPhaseReady(phase)).toBe(false)
    }
  )
})

describe('isClusterUpgradable', () => {
  it('returns true for a ready cluster that is neither upgrading nor paused', () => {
    expect(isClusterUpgradable(createKubernetesCluster())).toBe(true)
  })

  it('returns false when the cluster phase is not ready', () => {
    expect(isClusterUpgradable(createKubernetesCluster({ phase: 'Updating' }))).toBe(false)
  })

  it('returns false when the cluster is upgrading', () => {
    expect(isClusterUpgradable(createKubernetesCluster({ is_upgrading: true }))).toBe(false)
  })

  it('returns false when the cluster reconciliation is paused', () => {
    expect(isClusterUpgradable(createKubernetesCluster({ is_reconciliation_paused: true }))).toBe(false)
  })
})

describe('clusterStatus', () => {
  it('returns available when the cluster is available', () => {
    expect(clusterStatus(createKubernetesCluster({ is_available: true }))).toBe('available')
  })

  it('returns not-available when the cluster is not available', () => {
    expect(clusterStatus(createKubernetesCluster({ is_available: false }))).toBe('not-available')
  })
})

describe('formatNodesCount', () => {
  it('formats ready and desired replica counts', () => {
    expect(
      formatNodesCount({
        available_replicas: 1,
        desired_replicas: 3,
        ready_replicas: 2,
        replicas: 2,
        up_to_date_replicas: 2,
        versions: [],
      })
    ).toBe('2/3')
  })
})

describe('clusterVersion', () => {
  function createClusterWithVersions(controlPlaneVersions: string[], workerVersions: string[]): XoKubernetesCluster {
    const cluster = createKubernetesCluster()

    return {
      ...cluster,
      control_plane_status: {
        ...cluster.control_plane_status,
        versions: controlPlaneVersions.map(version => ({ replicas: 1, version })),
      },
      worker_status: {
        ...cluster.worker_status,
        versions: workerVersions.map(version => ({ replicas: 1, version })),
      },
    }
  }

  it('returns an empty string when no version is reported', () => {
    expect(clusterVersion(createClusterWithVersions([], []))).toBe('')
  })

  it('deduplicates versions across control plane and workers', () => {
    expect(clusterVersion(createClusterWithVersions(['v1.30.0'], ['v1.30.0']))).toBe('v1.30.0')
  })

  it('sorts versions numerically', () => {
    expect(clusterVersion(createClusterWithVersions(['v1.10.0', 'v1.9.0'], ['v1.10.0', 'v1.9.10', 'v1.9.2']))).toBe(
      'v1.9.0/v1.9.2/v1.9.10/v1.10.0'
    )
  })
})

describe('getClusterUpdates', () => {
  const cluster = createKubernetesCluster({ description: 'Production cluster' })

  const unchangedPayload = {
    description: 'Production cluster',
    control_plane_replicas: cluster.control_plane_status.desired_replicas,
    worker_replicas: cluster.worker_status.desired_replicas,
  }

  it('returns no update when nothing changed', () => {
    expect(getClusterUpdates(cluster, unchangedPayload)).toEqual([])
  })

  it('returns a description update when the description changed', () => {
    expect(getClusterUpdates(cluster, { ...unchangedPayload, description: 'Staging cluster' })).toEqual([
      { endpoint: 'kubernetes/clusters/cluster-1/description', body: { description: 'Staging cluster' } },
    ])
  })

  it('returns an empty description update when the description is cleared', () => {
    expect(getClusterUpdates(cluster, { ...unchangedPayload, description: '' })).toEqual([
      { endpoint: 'kubernetes/clusters/cluster-1/description', body: { description: '' } },
    ])
  })

  it('returns no description update when the cluster has no description and the field is empty', () => {
    expect(
      getClusterUpdates(createKubernetesCluster({ description: undefined }), { ...unchangedPayload, description: '' })
    ).toEqual([])
  })

  it('returns a replicas update for each changed node group', () => {
    expect(
      getClusterUpdates(cluster, {
        ...unchangedPayload,
        control_plane_replicas: unchangedPayload.control_plane_replicas + 2,
        worker_replicas: unchangedPayload.worker_replicas + 1,
      })
    ).toEqual([
      {
        endpoint: 'kubernetes/clusters/cluster-1/control-plane/replicas',
        body: { replicas: unchangedPayload.control_plane_replicas + 2 },
      },
      {
        endpoint: 'kubernetes/clusters/cluster-1/workers/replicas',
        body: { replicas: unchangedPayload.worker_replicas + 1 },
      },
    ])
  })
})
