import type {
  KubernetesClusterPhase,
  KubernetesReadyStatus,
  XoKubernetesCluster,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function isClusterDeletable(phase: KubernetesClusterPhase): boolean {
  switch (phase) {
    case 'Running':
    case 'Provisioned':
    case 'Failed':
    case 'Updating':
      return true
    default:
      return false
  }
}

export function isClusterPhaseReady(phase: KubernetesClusterPhase): boolean {
  switch (phase) {
    case 'Provisioned':
    case 'Running':
      return true
    default:
      return false
  }
}

export function clusterReadyStatus(cluster: XoKubernetesCluster): KubernetesReadyStatus {
  return cluster.is_available ? 'ready' : 'not-ready'
}

export function clusterVersion(cluster: XoKubernetesCluster): string {
  const versions = [...cluster.control_plane_status.versions, ...cluster.worker_status.versions].map(
    ({ version }) => version
  )

  return [...new Set(versions)].sort(compareStrings).join('/')
}
