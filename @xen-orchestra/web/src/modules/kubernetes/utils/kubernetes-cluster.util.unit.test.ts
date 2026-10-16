import type { KubernetesClusterPhase, XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import {
  clusterStatus,
  clusterVersion,
  formatNodesCount,
  isClusterDeletable,
  isClusterPhaseReady,
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
