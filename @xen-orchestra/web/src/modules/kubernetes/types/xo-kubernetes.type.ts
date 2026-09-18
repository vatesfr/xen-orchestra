export type XoKubernetesRoot = {
  name: string
  type: 'kubernetes'
}

export type XoKubernetesNodesStatus = {
  availableReplicas: number
  desiredReplicas: number
  readyReplicas: number
  replicas: number
}

export type XoKubernetesCluster = {
  controlPlaneEndpoint: string
  controlPlaneStatus: XoKubernetesNodesStatus
  createdAt: string
  id: string
  name: string
  phase: string
  tags: Record<string, string> | null
  type: 'kubernetes-cluster'
  workerStatus: XoKubernetesNodesStatus
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
