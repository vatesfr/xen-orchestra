import type {
  FrontXoKubernetesCluster,
  FrontXoKubernetesNamespace,
  FrontXoKubernetesNode,
  FrontXoKubernetesPod,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
export const kubernetesTreeClusters: FrontXoKubernetesCluster[] = [
  {
    name: 'production',
    controlPlaneEndpoint: 'https://k8s-prod.example.com:6443',
    phase: 'Ready',
  },
  {
    name: 'staging',
    controlPlaneEndpoint: 'https://k8s-staging.example.com:6443',
    phase: 'Ready',
  },
  {
    name: 'development',
    controlPlaneEndpoint: 'https://k8s-dev.example.com:6443',
    phase: 'Provisioning',
  },
]

export const kubernetesTreeNodes: FrontXoKubernetesNode[] = [
  {
    name: 'production-control-plane-1',
    endpoint: '10.0.0.11:6443',
    role: 'control-plane',
    status: 'Ready',
    $cluster: 'production',
  },
  {
    name: 'production-worker-1',
    endpoint: '10.0.0.21:10250',
    role: 'worker',
    status: 'Ready',
    $cluster: 'production',
  },
  {
    name: 'production-worker-2',
    endpoint: '10.0.0.22:10250',
    role: 'worker',
    status: 'NotReady',
    $cluster: 'production',
  },
  {
    name: 'staging-control-plane-1',
    endpoint: '10.0.1.11:6443',
    role: 'control-plane',
    status: 'Ready',
    $cluster: 'staging',
  },
  {
    name: 'staging-worker-1',
    endpoint: '10.0.1.21:10250',
    role: 'worker',
    status: 'Ready',
    $cluster: 'staging',
  },
  {
    name: 'development-control-plane-1',
    endpoint: '10.0.2.11:6443',
    role: 'control-plane',
    status: 'Ready',
    $cluster: 'development',
  },
]

export const kubernetesTreeNamespaces: FrontXoKubernetesNamespace[] = [
  {
    name: 'production-default',
    phase: 'Active',
    $cluster: 'production',
  },
  {
    name: 'production-monitoring',
    phase: 'Active',
    $cluster: 'production',
  },
  {
    name: 'production-empty-apps',
    phase: 'Active',
    $cluster: 'production',
  },
  {
    name: 'staging-default',
    phase: 'Active',
    $cluster: 'staging',
  },
  {
    name: 'development-default',
    phase: 'Active',
    $cluster: 'development',
  },
]

export const kubernetesTreePods: FrontXoKubernetesPod[] = [
  {
    name: 'production-api-7f8b9c',
    phase: 'Running',
    $namespace: 'production/production-default',
  },
  {
    name: 'production-worker-5d4e6f',
    phase: 'Running',
    $namespace: 'production/production-default',
  },
  {
    name: 'production-prometheus-0',
    phase: 'Running',
    $namespace: 'production/production-monitoring',
  },
  {
    name: 'staging-web-1a2b3c',
    phase: 'Running',
    $namespace: 'staging/staging-default',
  },
  {
    name: 'development-debug-9z8y7x',
    phase: 'Pending',
    $namespace: 'development/development-default',
  },
]

function groupByCluster<T extends { $cluster: string }>(items: T[]) {
  const map = new Map<string, T[]>()

  for (const item of items) {
    const group = map.get(item.$cluster) ?? []
    group.push(item)
    map.set(item.$cluster, group)
  }

  return map
}

function groupByNamespace<T extends { $namespace: string }>(items: T[]) {
  const map = new Map<string, T[]>()

  for (const item of items) {
    const group = map.get(item.$namespace) ?? []
    group.push(item)
    map.set(item.$namespace, group)
  }

  return map
}

export const kubernetesTreeNodesByCluster = groupByCluster(kubernetesTreeNodes)

export const kubernetesTreeNamespacesByCluster = groupByCluster(kubernetesTreeNamespaces)

export const kubernetesTreePodsByNamespace = groupByNamespace(kubernetesTreePods)
