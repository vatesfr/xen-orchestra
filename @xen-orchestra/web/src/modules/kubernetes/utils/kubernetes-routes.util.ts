import type {
  XoKubernetesCluster,
  XoKubernetesNamespace,
  XoKubernetesNode,
  XoKubernetesPod,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export function getKubernetesClusterRoute(clusterId: XoKubernetesCluster['id']): RouteLocationAsRelative {
  return {
    name: '/kubernetes/cluster/[id]',
    params: { id: clusterId },
  }
}

export function getKubernetesNodeRoute(nodeId: XoKubernetesNode['id']): RouteLocationAsRelative {
  return {
    name: '/kubernetes/node/[id]',
    params: { id: nodeId },
  }
}

export function getKubernetesNamespaceRoute(namespaceId: XoKubernetesNamespace['id']): RouteLocationAsRelative {
  return {
    name: '/kubernetes/namespace/[id]',
    params: { id: namespaceId },
  }
}

export function getKubernetesPodRoute(podId: XoKubernetesPod['id']): RouteLocationAsRelative {
  return {
    name: '/kubernetes/pod/[id]',
    params: { id: podId },
  }
}
