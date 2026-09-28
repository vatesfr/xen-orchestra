import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadArg = defineJobArg<KubernetesClusterCreatePayload>({
  identify: false,
  toArray: false,
})
