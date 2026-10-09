import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { defineJobArg } from '@core/packages/job'

export const xoKubernetesClustersArg = defineJobArg({
  identify: (cluster: XoKubernetesCluster) => cluster.id,
  toArray: true,
})

export const xoKubernetesClusterArg = defineJobArg({
  identify: (cluster: XoKubernetesCluster) => cluster.id,
  toArray: false,
})
