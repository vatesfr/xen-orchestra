import type { KubernetesClusterPhase } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterStatus, isClusterPhaseReady } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'

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
  // TODO Update this test when the others conditions are implemented (isControlPlaneInitialized + isInfrastructureProvisioned)
  it.each<KubernetesClusterPhase>(['Provisioned', 'Running'])('returns ready when phase is %s', phase => {
    expect(clusterStatus(createKubernetesCluster({ phase }))).toBe('ready')
  })

  it.each<KubernetesClusterPhase>(['Pending', 'Provisioning', 'Updating', 'Deleting', 'Deleted', 'Failed', 'Unknown'])(
    'returns not-ready when phase is %s',
    phase => {
      expect(clusterStatus(createKubernetesCluster({ phase }))).toBe('not-ready')
    }
  )
})
