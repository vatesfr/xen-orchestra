import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { defineJobArg } from '@core/packages/job'

export const clustersArg = defineJobArg<XoKubernetesCluster>({
  identify: cluster => cluster.id,
  toArray: true,
})
