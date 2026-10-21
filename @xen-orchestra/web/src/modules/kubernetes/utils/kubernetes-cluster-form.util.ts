import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterVersion, getControlPlaneHost } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { parseKubernetesTagsString } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'

export type CreateKubernetesClusterFormData = {
  name: string
  description: string
  tagsRaw: string
  control_plane_replicas: number
  worker_replicas: number
  control_plane_ip: string
  vm_name_prefix: string
  kubernetes_version: string | undefined
}

export function buildKubernetesClusterCreatePayload(
  form: CreateKubernetesClusterFormData & { kubernetes_version: string }
): KubernetesClusterCreatePayload {
  const payload: KubernetesClusterCreatePayload = {
    name: form.name,
    control_plane_replicas: form.control_plane_replicas,
    worker_replicas: form.worker_replicas,
    control_plane_ip: form.control_plane_ip,
    vm_name_prefix: form.vm_name_prefix,
    kubernetes_version: form.kubernetes_version,
  }

  if (form.description !== '') {
    payload.description = form.description
  }

  const tags = parseKubernetesTagsString(form.tagsRaw)

  if (tags !== undefined) {
    payload.tags = tags
  }

  return payload
}

export function buildKubernetesClusterEditPayload(form: CreateKubernetesClusterFormData): KubernetesClusterEditPayload {
  return {
    control_plane_replicas: form.control_plane_replicas,
    worker_replicas: form.worker_replicas,
  }
}

export function kubernetesClusterToFormData(cluster: XoKubernetesCluster): CreateKubernetesClusterFormData {
  return {
    name: cluster.name,
    description: cluster.description ?? '',
    // Displayed as a tags list in edit mode
    tagsRaw: '',
    control_plane_replicas: cluster.control_plane_status.desired_replicas,
    worker_replicas: cluster.worker_status.desired_replicas,
    control_plane_ip: getControlPlaneHost(cluster.control_plane_endpoint),
    // Not exposed by the cluster object
    vm_name_prefix: '',
    kubernetes_version: clusterVersion(cluster),
  }
}
