import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import type {
  KubernetesClusterOperation,
  KubernetesClusterPhase,
  KubernetesAvailabilityStatus,
  XoKubernetesCluster,
  XoKubernetesNodesStatus,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function formatNodesCount(status: XoKubernetesNodesStatus): string {
  return `${status.ready_replicas}/${status.desired_replicas}`
}

/**
 * The events stream flags a cluster being deleted with `is_deleting` while its phase can still be the previous one
 */
export function isClusterDeleting(cluster: XoKubernetesCluster): boolean {
  return cluster.is_deleting === true || cluster.phase === 'Deleting'
}

export function isClusterDeletable(cluster: XoKubernetesCluster): boolean {
  if (isClusterDeleting(cluster)) {
    return false
  }

  switch (cluster.phase) {
    case 'Running':
    case 'Provisioned':
    case 'Failed':
    case 'Updating':
      return true
    default:
      return false
  }
}

export function isClusterEditable(cluster: XoKubernetesCluster): boolean {
  if (isClusterDeleting(cluster)) {
    return false
  }

  switch (cluster.phase) {
    case 'Running':
    case 'Provisioned':
    case 'Updating':
      return true
    default:
      return false
  }
}

export function isClusterReconciliationToggleable(cluster: XoKubernetesCluster): boolean {
  return !isClusterDeleting(cluster) && cluster.phase !== 'Deleted'
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

export function isClusterUpgradable(cluster: XoKubernetesCluster): boolean {
  return (
    isClusterPhaseReady(cluster.phase) &&
    !isClusterDeleting(cluster) &&
    !cluster.is_upgrading &&
    !cluster.is_reconciliation_paused
  )
}

function isScalingNodes(status: XoKubernetesNodesStatus): boolean {
  return status.replicas !== status.desired_replicas
}

/**
 * Operation in progress on the cluster, by order of precedence
 *
 * Provisioning is checked before scaling: a new cluster has fewer replicas than desired while its nodes are created
 */
export function clusterCurrentOperation(cluster: XoKubernetesCluster): KubernetesClusterOperation | undefined {
  if (isClusterDeleting(cluster)) {
    return 'deleting'
  }

  if (cluster.is_upgrading) {
    return 'upgrading'
  }

  if (cluster.phase === 'Pending' || cluster.phase === 'Provisioning') {
    return 'provisioning'
  }

  if (isScalingNodes(cluster.control_plane_status) || isScalingNodes(cluster.worker_status)) {
    return 'scaling'
  }

  if (cluster.phase === 'Updating') {
    return 'updating'
  }

  return undefined
}

export function clusterStatus(cluster: XoKubernetesCluster): KubernetesAvailabilityStatus {
  return cluster.is_available ? 'available' : 'not-available'
}

/**
 * Versions run by the control plane and worker nodes, with duplicates
 */
export function clusterVersions(cluster: XoKubernetesCluster): string[] {
  return [...(cluster.control_plane_status.versions ?? []), ...(cluster.worker_status.versions ?? [])].map(
    ({ version }) => version
  )
}

export function clusterVersion(cluster: XoKubernetesCluster): string {
  return [...new Set(clusterVersions(cluster))].sort(compareStrings).join('/')
}

export type KubernetesClusterUpdate = {
  endpoint: string
  body: { replicas: number } | { description: string }
}

/**
 * Returns the updates to send to CAPI, skipping the fields that are unchanged
 */
export function getClusterUpdates(
  cluster: XoKubernetesCluster,
  payload: KubernetesClusterEditPayload
): KubernetesClusterUpdate[] {
  const updates: KubernetesClusterUpdate[] = []

  if (payload.description !== (cluster.description ?? '')) {
    updates.push({
      endpoint: `kubernetes/clusters/${cluster.id}/description`,
      body: { description: payload.description },
    })
  }

  if (payload.control_plane_replicas !== cluster.control_plane_status.desired_replicas) {
    updates.push({
      endpoint: `kubernetes/clusters/${cluster.id}/control-plane/replicas`,
      body: { replicas: payload.control_plane_replicas },
    })
  }

  if (payload.worker_replicas !== cluster.worker_status.desired_replicas) {
    updates.push({
      endpoint: `kubernetes/clusters/${cluster.id}/workers/replicas`,
      body: { replicas: payload.worker_replicas },
    })
  }

  return updates
}

export function getControlPlaneHost(endpoint: string): string {
  try {
    return new URL(endpoint.includes('://') ? endpoint : `https://${endpoint}`).hostname
  } catch {
    return endpoint
  }
}
