export type XoKubernetesRoot = {
  type: 'kubernetes'
  name: string
}

export type FrontXoKubernetesCluster = {
  name: string
  controlPlaneEndpoint: string
  phase: string
}

export type FrontXoKubernetesNode = {
  name: string
  endpoint: string
  role: string
  status: string
  $cluster: string
}

export type FrontXoKubernetesNamespace = {
  name: string
  phase?: string
  $cluster: string
}

export type FrontXoKubernetesPod = {
  name: string
  phase?: string
  $namespace: string
}
