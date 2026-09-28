import type { RouteLocationRaw } from 'vue-router'

export function getKubernetesClusterRoute(clusterId: string | number): RouteLocationRaw {
  return {
    name: '/kubernetes/cluster/[id]',
    params: { id: String(clusterId) },
  }
}

export function getKubernetesNodeRoute(nodeId: string | number): RouteLocationRaw {
  return {
    name: '/kubernetes/node/[id]',
    params: { id: String(nodeId) },
  }
}

export function getKubernetesNamespaceRoute(namespaceId: string | number): RouteLocationRaw {
  return {
    name: '/kubernetes/namespace/[id]',
    params: { id: String(namespaceId) },
  }
}

export function getKubernetesPodRoute(podId: string | number): RouteLocationRaw {
  return {
    name: '/kubernetes/pod/[id]',
    params: { id: String(podId) },
  }
}
