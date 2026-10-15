import type { Status } from '@core/components/status/VtsStatus.vue'

export type KubernetesReadyStatus = Extract<Status, 'ready' | 'not-ready'>

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

export type KubernetesStatus = KubernetesClusterPhase | 'paused' | 'not-paused' | true | false

export const KUBERNETES_ROOT_ID = 'kubernetes-root'

export type XoKubernetesRoot = {
  id: typeof KUBERNETES_ROOT_ID
  name: string
  type: 'kubernetes'
}

export type XoKubernetesReplicasVersion = {
  replicas: number
  version: string
}

export type XoKubernetesNodesStatus = {
  available_replicas: number
  desired_replicas: number
  ready_replicas: number
  up_to_date_replicas: number
  replicas: number
  versions: XoKubernetesReplicasVersion[]
}

export type XoKubernetesCluster = {
  control_plane_endpoint: string
  control_plane_status: XoKubernetesNodesStatus
  created_at: string
  id: string
  is_available: boolean
  is_reconciliation_paused: boolean
  name: string
  phase: KubernetesClusterPhase
  tags: Record<string, string> | null
  type: 'kubernetes-cluster'
  worker_status: XoKubernetesNodesStatus
}

export type XoKubernetesNode = {
  $cluster: string
  endpoint: string
  is_reconciliation_paused: boolean
  name: string
  node_id: string
  node_name: string
  role: 'control-plane' | 'worker'
  status: 'Ready' | 'NotReady'
  type: 'kubernetes-node'
}

/* TODO Update when the /namespaces API endpoint is implemented */
export type XoKubernetesNamespace = {
  $cluster: string
  id: string
  name: string
  phase?: string
  type: 'kubernetes-namespace'
}

/* TODO Update when the /pods API endpoint is implemented */
export type XoKubernetesPod = {
  $cluster: string
  $namespace: string
  id: string
  name: string
  phase?: string
  type: 'kubernetes-pod'
}
