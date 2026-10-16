import type {
  KubernetesClusterPhase,
  KubernetesAvailabilityStatus,
  XoKubernetesCluster,
  XoKubernetesNodesStatus,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function formatNodesCount(status: XoKubernetesNodesStatus): string {
  return `${status.ready_replicas}/${status.desired_replicas}`
}

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

export function clusterStatus(cluster: XoKubernetesCluster): KubernetesAvailabilityStatus {
  return cluster.is_available ? 'available' : 'not-available'
}

export function clusterVersion(cluster: XoKubernetesCluster): string {
  const versions = [...cluster.control_plane_status.versions, ...cluster.worker_status.versions].map(
    ({ version }) => version
  )

  return [...new Set(versions)].sort(compareStrings).join('/')
}
