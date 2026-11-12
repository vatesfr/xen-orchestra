import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

export type KubernetesAvailabilityStatus = 'available' | 'not-available'

export type KubernetesReadyStatus = 'ready' | 'not-ready' | 'unknown'

export type KubernetesSchedulingStatus = 'schedulable' | 'cordoned' | 'draining'

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

export type KubernetesClusterOperation = 'deleting' | 'upgrading' | 'scaling' | 'updating' | 'provisioning'

export type KubernetesNodeOperation =
  | Extract<KubernetesClusterOperation, 'deleting' | 'upgrading' | 'scaling'>
  | 'draining'

export type KubernetesStatus =
  | KubernetesAvailabilityStatus
  | KubernetesClusterPhase
  | KubernetesReadyStatus
  | KubernetesSchedulingStatus
  | 'yes'
  | 'no'
  | 'paused'
  | true
  | false

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
  versions: XoKubernetesReplicasVersion[] | null
}

export type XoKubernetesVersionGroup = {
  version: string
  releases: string[] | null
}

export type XoKubernetesCluster = {
  api_server_port: number
  control_plane_endpoint: string
  control_plane_status: XoKubernetesNodesStatus
  created_at: string
  created_by_xo_user_id?: string
  description?: string
  id: string
  is_available: boolean
  is_control_plane_initialized?: boolean
  is_cordon?: boolean
  is_deleting?: boolean
  is_draining?: boolean
  is_infrastructure_provisioned: boolean
  is_reconciliation_paused: boolean
  is_scaling?: boolean
  is_upgrading?: boolean
  name: string
  phase: KubernetesClusterPhase
  pod_cidr_blocks: string[] | null
  service_cidr_blocks: string[] | null
  service_domain: string
  tags: Record<string, string> | null
  type: 'kubernetes-cluster'
  worker_status: XoKubernetesNodesStatus
}

export type XoKubernetesNode = {
  $cluster: string
  id: string
  ips?: string[] | null
  is_cordon?: boolean
  is_deleting?: boolean
  is_draining?: boolean
  is_reconciliation_paused: boolean
  name: string
  node_name?: string
  role: 'control-plane' | 'worker'
  status: 'Ready' | 'NotReady' | 'Unknown'
  type: 'kubernetes-node'
  version: string
  vm_id?: FrontXoVm['id']
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
