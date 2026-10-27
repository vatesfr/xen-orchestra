import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
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

export function isClusterEditable(phase: KubernetesClusterPhase): boolean {
  switch (phase) {
    case 'Running':
    case 'Provisioned':
    case 'Updating':
      return true
    default:
      return false
  }
}

export function isClusterReconciliationToggleable(phase: KubernetesClusterPhase): boolean {
  switch (phase) {
    case 'Deleting':
    case 'Deleted':
      return false
    default:
      return true
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

export function isClusterUpgradable(cluster: XoKubernetesCluster): boolean {
  return isClusterPhaseReady(cluster.phase) && !cluster.is_upgrading && !cluster.is_reconciliation_paused
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
