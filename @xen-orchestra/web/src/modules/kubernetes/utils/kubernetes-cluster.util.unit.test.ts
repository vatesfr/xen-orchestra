import type { KubernetesClusterPhase, XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import {
  clusterCurrentOperation,
  clusterStatus,
  clusterVersion,
  formatNodesCount,
  getClusterUpdates,
  isClusterDeletable,
  isClusterDeleting,
  isClusterEditable,
  isClusterPhaseReady,
  isClusterReconciliationToggleable,
  isClusterUpgradable,
} from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'

describe('isClusterDeleting', () => {
  it('returns false for a cluster that is not being deleted', () => {
    expect(isClusterDeleting(createKubernetesCluster())).toBe(false)
  })

  it('returns true when the cluster phase is Deleting', () => {
    expect(isClusterDeleting(createKubernetesCluster({ phase: 'Deleting' }))).toBe(true)
  })

  it('returns true when the cluster is flagged as deleting while its phase is still the previous one', () => {
    expect(isClusterDeleting(createKubernetesCluster({ phase: 'Provisioned', is_deleting: true }))).toBe(true)
  })
})

describe('isClusterDeletable', () => {
  it.each<KubernetesClusterPhase>(['Running', 'Provisioned', 'Failed', 'Updating'])('returns true for %s', phase => {
    expect(isClusterDeletable(createKubernetesCluster({ phase }))).toBe(true)
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning', 'Deleting', 'Deleted', 'Unknown'])(
    'returns false for %s',
    phase => {
      expect(isClusterDeletable(createKubernetesCluster({ phase }))).toBe(false)
    }
  )

  it('returns false when the cluster is flagged as deleting', () => {
    expect(isClusterDeletable(createKubernetesCluster({ phase: 'Provisioned', is_deleting: true }))).toBe(false)
  })
})

describe('isClusterEditable', () => {
  it.each<KubernetesClusterPhase>(['Running', 'Provisioned', 'Updating'])('returns true for %s', phase => {
    expect(isClusterEditable(createKubernetesCluster({ phase }))).toBe(true)
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning', 'Deleting', 'Deleted', 'Failed', 'Unknown'])(
    'returns false for %s',
    phase => {
      expect(isClusterEditable(createKubernetesCluster({ phase }))).toBe(false)
    }
  )

  it('returns false when the cluster is flagged as deleting', () => {
    expect(isClusterEditable(createKubernetesCluster({ phase: 'Provisioned', is_deleting: true }))).toBe(false)
  })
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
    expect(isClusterReconciliationToggleable(createKubernetesCluster({ phase }))).toBe(true)
  })

  it.each<KubernetesClusterPhase>(['Deleting', 'Deleted'])('returns false for %s', phase => {
    expect(isClusterReconciliationToggleable(createKubernetesCluster({ phase }))).toBe(false)
  })

  it('returns false when the cluster is flagged as deleting', () => {
    expect(
      isClusterReconciliationToggleable(createKubernetesCluster({ phase: 'Provisioned', is_deleting: true }))
    ).toBe(false)
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

  it('returns false when the cluster is flagged as deleting', () => {
    expect(isClusterUpgradable(createKubernetesCluster({ is_deleting: true }))).toBe(false)
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

  it('returns an empty string when the versions are not reported yet', () => {
    const cluster = createKubernetesCluster()

    expect(
      clusterVersion({
        ...cluster,
        control_plane_status: { ...cluster.control_plane_status, versions: null },
        worker_status: { ...cluster.worker_status, versions: null },
      })
    ).toBe('')
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

describe('clusterCurrentOperation', () => {
  const settledNodesStatus: XoKubernetesCluster['control_plane_status'] = {
    available_replicas: 1,
    desired_replicas: 1,
    ready_replicas: 1,
    up_to_date_replicas: 1,
    replicas: 1,
    versions: [],
  }

  const createSettledCluster = (overrides: Partial<XoKubernetesCluster> = {}) =>
    createKubernetesCluster({
      control_plane_status: settledNodesStatus,
      worker_status: settledNodesStatus,
      ...overrides,
    })

  it('returns undefined when no operation is in progress', () => {
    expect(clusterCurrentOperation(createSettledCluster())).toBeUndefined()
  })

  it('returns deleting when the cluster is being deleted, even while upgrading', () => {
    expect(clusterCurrentOperation(createSettledCluster({ phase: 'Deleting', is_upgrading: true }))).toBe('deleting')
  })

  it('returns deleting when the cluster is flagged as deleting while its phase is still the previous one', () => {
    expect(clusterCurrentOperation(createSettledCluster({ phase: 'Provisioned', is_deleting: true }))).toBe('deleting')
  })

  it('returns upgrading when the cluster is upgrading, even while scaling', () => {
    const cluster = createSettledCluster({
      is_upgrading: true,
      worker_status: { ...settledNodesStatus, desired_replicas: 3 },
    })

    expect(clusterCurrentOperation(cluster)).toBe('upgrading')
  })

  it('returns scaling when the control plane replicas differ from the desired ones', () => {
    const cluster = createSettledCluster({ control_plane_status: { ...settledNodesStatus, desired_replicas: 3 } })

    expect(clusterCurrentOperation(cluster)).toBe('scaling')
  })

  it('returns scaling when the worker replicas differ from the desired ones', () => {
    const cluster = createSettledCluster({ worker_status: { ...settledNodesStatus, replicas: 2 } })

    expect(clusterCurrentOperation(cluster)).toBe('scaling')
  })

  it('returns updating when the cluster phase is Updating', () => {
    expect(clusterCurrentOperation(createSettledCluster({ phase: 'Updating' }))).toBe('updating')
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning'])('returns provisioning for %s', phase => {
    expect(clusterCurrentOperation(createSettledCluster({ phase }))).toBe('provisioning')
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning'])(
    'returns provisioning for %s while the replicas are being created',
    phase => {
      const cluster = createSettledCluster({
        phase,
        control_plane_status: { ...settledNodesStatus, replicas: 0, desired_replicas: 3 },
        worker_status: { ...settledNodesStatus, replicas: 0, desired_replicas: 2 },
      })

      expect(clusterCurrentOperation(cluster)).toBe('provisioning')
    }
  )

  it.each<KubernetesClusterPhase>(['Running', 'Provisioned', 'Failed', 'Deleted', 'Unknown'])(
    'returns undefined for %s',
    phase => {
      expect(clusterCurrentOperation(createSettledCluster({ phase }))).toBeUndefined()
    }
  )
})
