export type XoKubernetesRoot = {
  type: 'kubernetes'
  name: string
}

export type FrontXoKubernetesCluster = {
  id: string
  name: string
  controlPlaneEndpoint: string
  phase: string
}

export type FrontXoKubernetesNode = {
  name: string
  endpoint: string
  role: string
  status: string
}

export type FrontXoKubernetesNamespace = {
  name: string
  phase?: string
}

export type FrontXoKubernetesPod = {
  name: string
  phase?: string
}

export type GroupedFrontXoKubernetesNode = FrontXoKubernetesNode & {
  $cluster: string
}

export type GroupedFrontXoKubernetesNamespace = FrontXoKubernetesNamespace & {
  $cluster: string
}

export type GroupedFrontXoKubernetesPod = FrontXoKubernetesPod & {
  $namespace: string
}
