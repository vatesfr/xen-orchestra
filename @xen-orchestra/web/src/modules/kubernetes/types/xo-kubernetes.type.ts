import type { Status } from '@core/components/status/VtsStatus.vue'

export type KubernetesClusterStatus = Extract<Status, 'ready' | 'partially-ready' | 'not-ready'>

export type KubernetesClusterPhase =
  | 'Pending'
  | 'Provisioning'
  | 'Provisioned'
  | 'Running'
  | 'Updating'
  | 'Deleting'
  | 'Deleted'
  | 'Failed'
  | 'Unknown'

export type KubernetesStatus = KubernetesClusterStatus | KubernetesClusterPhase | true | false

export const KUBERNETES_ROOT_ID = 'kubernetes-root'

export type XoKubernetesRoot = {
  id: typeof KUBERNETES_ROOT_ID
  name: string
  type: 'kubernetes'
}

export type XoKubernetesNodesStatus = {
  available_replicas: number
  desired_replicas: number
  ready_replicas: number
  replicas: number
}

export type XoKubernetesCluster = {
  control_plane_endpoint: string
  control_plane_status: XoKubernetesNodesStatus
  created_at: string
  id: string
  name: string
  phase: KubernetesClusterPhase
  tags: Record<string, string> | null
  type: 'kubernetes-cluster'
  worker_status: XoKubernetesNodesStatus
}

export type XoKubernetesNode = {
  $cluster: string
  endpoint: string
  id: string
  kubernetesUid?: string
  name: string
  providerId?: string
  role: string
  status: string
  type: 'kubernetes-node'
}

export type XoKubernetesNamespace = {
  $cluster: string
  id: string
  kubernetesUid?: string
  name: string
  phase?: string
  type: 'kubernetes-namespace'
}

export type XoKubernetesPod = {
  $cluster: string
  $namespace: string
  id: string
  kubernetesUid?: string
  name: string
  phase?: string
  type: 'kubernetes-pod'
}
