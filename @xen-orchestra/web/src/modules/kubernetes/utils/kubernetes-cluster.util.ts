import type {
  KubernetesClusterPhase,
  KubernetesClusterStatus,
  XoKubernetesCluster,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

export function isClusterPhaseReady(phase: KubernetesClusterPhase): boolean {
  switch (phase) {
    case 'Provisioned':
    case 'Running':
      return true
    default:
      return false
  }
}

export function clusterStatus(cluster: XoKubernetesCluster): KubernetesClusterStatus {
  const isPhaseReady = cluster.phase === 'Provisioned' || cluster.phase === 'Running'
  const isControlPlaneInitialized = false
  const isInfrastructureProvisioned = false

  /* if (isPhaseReady && isControlPlaneInitialized && isInfrastructureProvisioned) { */
  if (isPhaseReady) {
    return 'ready'
  } else if (!isPhaseReady && !isControlPlaneInitialized && !isInfrastructureProvisioned) {
    return 'not-ready'
  } else {
    return 'partially-ready'
  }
}
