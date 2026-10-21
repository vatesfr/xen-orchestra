import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editPayloadArg = defineJobArg<KubernetesClusterEditPayload>({
  identify: false,
  toArray: false,
})
